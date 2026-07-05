import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "Home": "Home",
      "Facilities": "Facilities",
      "About": "About",
      "Login": "Login",
      "Predictive Analytics": "Predictive Analytics",
      "warning_msg": "AI models warning district admins of imminent medicine stock-outs weeks in advance.",
      "Access Portal": "Access Portal",
      "Learn More": "Learn More",
      "Smart Health Infrastructure": "Smart Health Infrastructure",
      "infra_msg": "Empowering Primary & Community Health Centres across India with Real-Time AI-Driven Management.",
      "Optimized Patient Flow": "Optimized Patient Flow",
      "flow_msg": "Digitize patient intake and monitor live queues to distribute load effectively.",
      "National Health Mission": "National Health Mission"
    }
  },
  hi: {
    translation: {
      "Home": "होम",
      "Facilities": "सुविधाएं",
      "About": "हमारे बारे में",
      "Login": "लॉगिन करें",
      "Predictive Analytics": "पूर्वानुमानित विश्लेषण",
      "warning_msg": "AI मॉडल जिला प्रशासकों को हफ्तों पहले दवा की कमी की चेतावनी देता है।",
      "Access Portal": "पोर्टल खोलें",
      "Learn More": "और जानें",
      "Smart Health Infrastructure": "स्मार्ट स्वास्थ्य बुनियादी ढांचा",
      "infra_msg": "भारत भर में प्राथमिक और सामुदायिक स्वास्थ्य केंद्रों को वास्तविक समय AI प्रबंधन के साथ सशक्त बनाना।",
      "Optimized Patient Flow": "अनुकूलित रोगी प्रवाह",
      "flow_msg": "रोगी के सेवन को डिजिटल करें और भीड़ को प्रभावी ढंग से वितरित करने के लिए लाइव कतारों की निगरानी करें।",
      "National Health Mission": "राष्ट्रीय स्वास्थ्य मिशन"
    }
  },
  or: {
    translation: {
      "Home": "ହୋମ୍",
      "Facilities": "ସୁବିଧା",
      "About": "ଆମ ବିଷୟରେ",
      "Login": "ଲଗଇନ୍ କରନ୍ତୁ",
      "Predictive Analytics": "ପୂର୍ବାନୁମାନିତ ବିଶ୍ଳେଷଣ",
      "warning_msg": "AI ମଡେଲ୍ ଜିଲ୍ଲା ପ୍ରଶାସକମାନଙ୍କୁ ସପ୍ତାହ ପୂର୍ବରୁ ଔଷଧ ଅଭାବ ବିଷୟରେ ଚେତାବନୀ ଦେଇଥାଏ |",
      "Access Portal": "ପୋର୍ଟାଲ୍ ଖୋଲନ୍ତୁ",
      "Learn More": "ଅଧିକ ଜାଣନ୍ତୁ",
      "Smart Health Infrastructure": "ସ୍ମାର୍ଟ ସ୍ୱାସ୍ଥ୍ୟ ଭିତ୍ତିଭୂମି",
      "infra_msg": "ବାସ୍ତବ ସମୟ ଏଆଇ-ଚାଳିତ ପରିଚାଳନା ସହିତ ସମଗ୍ର ଭାରତରେ ପ୍ରାଥମିକ ଏବଂ ସାମ୍ପ୍ରଦାୟିକ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରଗୁଡ଼ିକୁ ସଶକ୍ତ କରିବା |",
      "Optimized Patient Flow": "ଅପ୍ଟିମାଇଜ୍ ରୋଗୀ ପ୍ରବାହ",
      "flow_msg": "ରୋଗୀ ଗ୍ରହଣକୁ ଡିଜିଟାଇଜ୍ କରନ୍ତୁ ଏବଂ ଭାରକୁ ପ୍ରଭାବଶାଳୀ ଭାବରେ ବଣ୍ଟନ କରିବା ପାଇଁ ଲାଇଭ୍ ଧାଡିଗୁଡିକ ଉପରେ ନଜର ରଖନ୍ତୁ |",
      "National Health Mission": "ଜାତୀୟ ସ୍ୱାସ୍ଥ୍ୟ ମିଶନ୍"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
