const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./db');

const getApiKey = () => process.env.GEMINI_API_KEY || 'AIzaSyAFnKGCmCum7F44yGcD4zFQ9KHuDiHuM1U';

const getSystemTelemetryContext = async () => {
  try {
    const facilities = await db.query("SELECT * FROM facilities");
    const inventory = await db.query("SELECT * FROM inventory");
    const patients = await db.query("SELECT * FROM appointments WHERE status != 'completed'");
    const activeDoctors = await db.query("SELECT * FROM attendance WHERE status = 'on-duty' AND punch_out IS NULL");

    return {
      facilities,
      inventory,
      patientsCount: patients.length,
      activeDoctorsCount: activeDoctors.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Telemetry context error:", error);
    return null;
  }
};

const handleLocalFallback = (message, context, language = 'en') => {
  const query = message.toLowerCase();
  const isHindi = language === 'hi';
  const isOdia = language === 'or';

  // 0. Generic stock lookup check
  if (query.includes('medicine') || query.includes('stock') || query.includes('dawa') || query.includes('दवा') || query.includes('ଔଷଧ') || query.includes('ସାମଗ୍ରୀ')) {
    if (context && context.inventory) {
      let totals = {};
      context.inventory.forEach(item => {
        const name = item.item_name;
        totals[name] = (totals[name] || 0) + item.stock;
      });
      let list = Object.entries(totals).map(([name, stock]) => `${name}: ${stock} units`).join(', ');
      
      if (isHindi) {
        return `जिले में दवाओं की कुल उपलब्धता इस प्रकार है: ${list}।`;
      } else if (isOdia) {
        return `ସମଗ୍ର ଜିଲ୍ଲାରେ ଔଷଧର ମୋଟ ଉପଲବ୍ଧତା ହେଉଛି: ${list} |`;
      } else {
        return `Total medicine stocks across the district: ${list}.`;
      }
    }
  }

  // 1. Medicine stock checking (e.g. Paracetamol, ORS, Amoxicillin)
  let matchedItem = null;
  if (context && context.inventory) {
    matchedItem = context.inventory.find(item => {
      const itemName = item.item_name.toLowerCase();
      if (query.includes('paracetamol') && itemName.includes('paracetamol')) return true;
      if (query.includes('amoxicillin') && itemName.includes('amoxicillin')) return true;
      if (/\bors\b/i.test(query) && itemName.includes('ors')) return true;
      if (query.includes('sugar') && itemName.includes('sugar')) return true;
      if (query.includes(itemName)) return true;
      return false;
    });
  }

  if (matchedItem) {
    // Sum stock across all clinics for this medicine name
    const allMatches = context.inventory.filter(item => 
      item.item_name.toLowerCase().includes(matchedItem.item_name.toLowerCase())
    );
    const totalStock = allMatches.reduce((sum, item) => sum + item.stock, 0);
    
    // Get clinics detail list
    let clinicBreakdown = allMatches.map(item => {
      const facility = context.facilities.find(f => f.id === item.facility_id);
      const facName = facility ? facility.name : item.facility_id;
      return `${facName}: ${item.stock} ${item.unit}`;
    }).join(', ');

    if (isHindi) {
      return `पूरे जिले में ${matchedItem.item_name} का कुल स्टॉक ${totalStock} ${matchedItem.unit} है। विवरण - ${clinicBreakdown}।`;
    } else if (isOdia) {
      return `ସମଗ୍ର ଜିଲ୍ଲାରେ ${matchedItem.item_name} ର ମୋଟ ଷ୍ଟକ୍ ହେଉଛି ${totalStock} ${matchedItem.unit} | ସବିଶେଷ ବିବରଣୀ - ${clinicBreakdown} |`;
    } else {
      return `The total stock of ${matchedItem.item_name} across the district is ${totalStock} ${matchedItem.unit}. Breakdowns: ${clinicBreakdown}.`;
    }
  }

  // 2. Bed availability checking
  if (query.includes('bed') || query.includes('beds') || query.includes('बिस्तर') || query.includes('ବେଡ୍')) {
    let totalAvail = 0;
    let totalCap = 0;
    let detail = context.facilities.map(f => {
      totalAvail += f.available_beds;
      totalCap += f.total_beds;
      return `${f.name}: ${f.available_beds}/${f.total_beds} beds free`;
    }).join(', ');

    if (isHindi) {
      return `जिले में कुल ${totalAvail} / ${totalCap} बेड उपलब्ध हैं। विवरण - ${detail}।`;
    } else if (isOdia) {
      return `ଜିଲ୍ଲାରେ ମୋଟ ${totalAvail} / ${totalCap} ବେଡ୍ ଉପଲବ୍ଧ ଅଛି | ସବିଶେଷ ବିବରଣୀ - ${detail} |`;
    } else {
      return `There are currently ${totalAvail} available beds out of a total capacity of ${totalCap} in the district. Breakdowns: ${detail}.`;
    }
  }

  // 3. Queue waits and patient volume checking
  if (query.includes('wait') || query.includes('time') || query.includes('queue') || query.includes('प्रतीक्षा') || query.includes('ଲାଇନ')) {
    let detail = context.facilities.map(f => {
      return `${f.name} wait time is ${f.wait_time}`;
    }).join(', ');

    if (isHindi) {
      return `स्वास्थ्य केंद्रों में अनुमानित प्रतीक्षा समय इस प्रकार हैं: ${detail}।`;
    } else if (isOdia) {
      return `ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରଗୁଡ଼ିକରେ ଆନୁମାନିକ ଅପେକ୍ଷା ସମୟ ହେଉଛି: ${detail} |`;
    } else {
      return `Estimated queue wait times at clinics: ${detail}.`;
    }
  }

  // 4. Doctor active rosters
  if (query.includes('doctor') || query.includes('doctors') || query.includes('attendance') || query.includes('चिकित्सक') || query.includes('ଡାକ୍ତର')) {
    let totalDocs = context.facilities.reduce((sum, f) => sum + (f.doctors || 0), 0);
    let detail = context.facilities.map(f => `${f.name}: ${f.doctors || 0} active`).join(', ');

    if (isHindi) {
      return `वर्तमान में जिले में कुल ${totalDocs} डॉक्टर ड्यूटी पर सक्रिय हैं। विवरण - ${detail}।`;
    } else if (isOdia) {
      return `ବର୍ତ୍ତମାନ ଜିଲ୍ଲାରେ ମୋଟ ${totalDocs} ଡାକ୍ତର ଡ୍ୟୁଟିରେ ସକ୍ରିୟ ଅଛନ୍ତି | ସବିଶେଷ ବିବରଣୀ - ${detail} |`;
    } else {
      return `There are currently ${totalDocs} doctors on active duty rosters. Breakdowns: ${detail}.`;
    }
  }

  // General Fallback Replies
  if (isHindi) {
    return `नमस्ते! मैं आपका मेराअस्पताल एआई सहायक हूँ। मैं जिले में दवाओं के स्टॉक, बिस्तरों की संख्या, डॉक्टरों की उपस्थिति या प्रतीक्षा समय के बारे में जानकारी प्राप्त कर सकता हूँ। कृपया पूछें: "पैरासिटामोल स्टॉक" या "उपलब्ध बेड"।`;
  } else if (isOdia) {
    return `ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର ମେରାଅସ୍ପିଟାଲ୍ ଏଆଇ ସହାୟକ | ମୁଁ ଜିଲ୍ଲାରେ ଔଷଧର ଉପଲବ୍ଧତା, ବେଡ୍ ସଂଖ୍ୟା, ଡାକ୍ତରଙ୍କ ଉପସ୍ଥିତି କିମ୍ବା ଅପେକ୍ଷା ସମୟ ବିଷୟରେ ଜଣାଇ ପାରିବି | ଦୟาକରି ପଚାରନ୍ତୁ: "ପାରାସିଟାମୋଲ ଷ୍ଟକ୍" କିମ୍ବା "ବେଡ୍ ଉପଲବ୍ଧତା" |`;
  } else {
    return `Hello! I am your MeraAsptal AI Assistant. I can search real-time logs for medicines, beds, doctor rosters, or wait times in the district. Try asking: "availability of paracetamols", "free beds", or "doctor roster levels".`;
  }
};

const generateChatResponse = async (message, language = 'en') => {
  const apiKey = getApiKey();
  const context = await getSystemTelemetryContext();
  
  if (!apiKey || apiKey.startsWith('your_') || apiKey.startsWith('AIzaSyAFnKGCmCum7F44yGcD4zFQ9KHuDiHuM1U')) {
    return handleLocalFallback(message, context, language);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const langName = language === 'hi' ? 'Hindi' : language === 'or' ? 'Odia' : 'English';

    const prompt = `You are a Senior Medical Officer and AI Assistant for "MeraAsptal" (National Health Mission, Government of India).
    You have direct access to the live telemetry database of Khordha district clinics:
    
    SYSTEM DATA:
    ${JSON.stringify(context, null, 2)}
    
    INSTRUCTIONS:
    - Answer the following user query: "${message}".
    - The answer must be strictly in the language: ${langName}. If the query is in Hindi/Odia, reply in Hindi/Odia.
    - Provide helpful, accurate, operational medical infrastructure and supply answers based on the live system data.
    - Keep it concise, professional, and citizen-friendly. Avoid technical developer jargon.
    - Do not output code blocks, backticks, or raw JSON. Output standard text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Gemini AI Chat Error, falling back to local database processor:", error);
    return handleLocalFallback(message, context, language);
  }
};

// Analytical & AI-driven Demand Forecast & Stock-out warning
const generateForecast = async (facilityId) => {
  try {
    // 1. Fetch current inventory levels
    const sql = facilityId 
      ? "SELECT i.*, f.name as facility_name FROM inventory i JOIN facilities f ON i.facility_id = f.id WHERE i.facility_id = ?"
      : "SELECT i.*, f.name as facility_name FROM inventory i JOIN facilities f ON i.facility_id = f.id";
    const params = facilityId ? [facilityId] : [];
    const items = await db.query(sql, params);

    // 2. Compute projections
    // In production, we evaluate past consumption. Here we use threshold run rates:
    // Run rate is simulated based on active queues and stock thresholds.
    const forecastResults = items.map(item => {
      // Mock average consumption rate per day
      let dailyUsage = Math.round(item.threshold / 15); // assume threshold covers 15 days
      if (dailyUsage <= 0) dailyUsage = 2;
      
      const daysRemaining = Math.max(0, Math.floor(item.stock / dailyUsage));
      const projectedNextMonthDemand = dailyUsage * 30;
      const shortageRisk = item.stock < item.threshold ? 'High' : (item.stock < item.threshold * 1.5 ? 'Medium' : 'Low');
      
      // Predict stock-out date
      const stockOutDate = new Date();
      stockOutDate.setDate(stockOutDate.getDate() + daysRemaining);

      return {
        id: item.id,
        facilityName: item.facility_name,
        facilityId: item.facility_id,
        itemName: item.item_name,
        currentStock: item.stock,
        threshold: item.threshold,
        dailyUsage,
        daysRemaining,
        projectedNextMonthDemand,
        shortageRisk,
        predictedStockOutDate: daysRemaining < 30 ? stockOutDate.toISOString().split('T')[0] : 'None (Safe)'
      };
    });

    return forecastResults;
  } catch (error) {
    console.error("Forecasting calculation error:", error);
    throw error;
  }
};

// Redistribution matching logic
const generateRedistribution = async () => {
  try {
    // Reallocate stock from facilities having excess to those running critical
    const allInventory = await db.query("SELECT i.*, f.name as facility_name FROM inventory i JOIN facilities f ON i.facility_id = f.id");
    
    // Group inventory by item name
    const itemsByName = {};
    allInventory.forEach(item => {
      if (!itemsByName[item.item_name]) {
        itemsByName[item.item_name] = [];
      }
      itemsByName[item.item_name].push(item);
    });

    const recommendations = [];

    // Analyze each item for potential redistributions
    Object.keys(itemsByName).forEach(itemName => {
      const clinics = itemsByName[itemName];
      
      // Find critical/low clinics
      const shortages = clinics.filter(c => c.stock < c.threshold);
      // Find surplus clinics
      const surpluses = clinics.filter(c => c.stock > c.threshold * 2);

      shortages.forEach(deficitClinic => {
        surpluses.forEach(surplusClinic => {
          const needed = deficitClinic.threshold - deficitClinic.stock;
          const availableToTransfer = surplusClinic.stock - (surplusClinic.threshold * 2);

          if (availableToTransfer > 50) {
            const transferQty = Math.min(needed, availableToTransfer);
            recommendations.push({
              itemName,
              sourceFacilityId: surplusClinic.facility_id,
              sourceFacilityName: surplusClinic.facility_name,
              destFacilityId: deficitClinic.facility_id,
              destFacilityName: deficitClinic.facility_name,
              transferQuantity: transferQty,
              reason: `${deficitClinic.facility_name} is critically low on ${itemName} (${deficitClinic.stock} items). ${surplusClinic.facility_name} holds a healthy surplus (${surplusClinic.stock} items).`
            });
          }
        });
      });
    });

    return recommendations;
  } catch (error) {
    console.error("Redistribution matching error:", error);
    throw error;
  }
};

// AI scoring algorithm
const generateCenterScores = async () => {
  try {
    const facilities = await db.query("SELECT * FROM facilities");
    const inventory = await db.query("SELECT * FROM inventory");
    const patients = await db.query("SELECT * FROM appointments WHERE status = 'waiting'");
    
    // Group variables by facility
    const scores = [];

    for (const fac of facilities) {
      // 1. Bed Occupancy Score (20 pts)
      const bedOccupancyRate = fac.total_beds > 0 ? (fac.total_beds - fac.available_beds) / fac.total_beds : 0;
      const bedScore = Math.max(0, 20 - (bedOccupancyRate * 20)); // maximum points when beds are completely free

      // 2. Doctor Presence Score (25 pts)
      // PHCs target 2+ doctors, CHCs target 6+
      const docTarget = fac.type === 'CHC' ? 6 : 2;
      const docRatio = fac.doctors >= docTarget ? 1.0 : (fac.doctors / docTarget);
      const doctorScore = docRatio * 25;

      // 3. Medicine Availability Score (35 pts)
      const facInventory = inventory.filter(i => i.facility_id === fac.id);
      const stockouts = facInventory.filter(i => i.stock < i.threshold).length;
      const stockoutRatio = facInventory.length > 0 ? stockouts / facInventory.length : 0;
      const inventoryScore = Math.max(0, 35 - (stockoutRatio * 35));

      // 4. Patient Footfall Pressure Score (20 pts)
      const waitingPatients = patients.filter(p => p.facility_id === fac.id).length;
      // High patient queue drops performance score
      const patientPressureRatio = Math.min(1.0, waitingPatients / 10);
      const patientScore = Math.max(0, 20 - (patientPressureRatio * 20));

      // Calculate composite score
      const totalScore = Math.round(bedScore + doctorScore + inventoryScore + patientScore);
      let riskColor = 'green';
      if (totalScore < 40) riskColor = 'red';
      else if (totalScore < 75) riskColor = 'yellow';

      scores.push({
        facilityId: fac.id,
        name: fac.name,
        type: fac.type,
        latitude: fac.latitude,
        longitude: fac.longitude,
        bedScore: Math.round(bedScore),
        doctorScore: Math.round(doctorScore),
        inventoryScore: Math.round(inventoryScore),
        patientScore: Math.round(patientScore),
        totalScore,
        riskColor,
        alerts: {
          criticalBeds: fac.available_beds === 0,
          criticalMeds: stockouts,
          doctorShortage: fac.doctors < 1
        }
      });
    }

    return scores;
  } catch (error) {
    console.error("Scoring calculator error:", error);
    throw error;
  }
};

module.exports = {
  generateChatResponse,
  generateForecast,
  generateRedistribution,
  generateCenterScores
};
