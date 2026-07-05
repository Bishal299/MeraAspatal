import { db } from './firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';

export const seedDatabase = async () => {
  try {
    const batch = writeBatch(db);

    // 1. Seed Facilities
    const facilities = [
      { id: 'FAC_1', name: 'PHC Kantabada', distance: '2.5 km', beds: 12, totalBeds: 20, doctors: 3, waitTime: '15 mins', status: 'available' },
      { id: 'FAC_2', name: 'CHC Balipatna', distance: '8.1 km', beds: 2, totalBeds: 50, doctors: 8, waitTime: '45 mins', status: 'crowded' },
      { id: 'FAC_3', name: 'PHC Mendhasal', distance: '12.4 km', beds: 0, totalBeds: 15, doctors: 2, waitTime: '1 hr', status: 'full' },
    ];
    facilities.forEach(fac => {
      const ref = doc(collection(db, 'facilities'), fac.id);
      batch.set(ref, fac);
    });

    // 2. Seed Inventory for PHC Kantabada
    const inventory = [
      { id: 'INV_1', name: 'Paracetamol 500mg', stock: 1200, threshold: 500, status: 'ok' },
      { id: 'INV_2', name: 'Amoxicillin 250mg', stock: 150, threshold: 300, status: 'low' },
      { id: 'INV_3', name: 'ORS Packets', stock: 50, threshold: 200, status: 'critical' },
      { id: 'INV_4', name: 'IV Fluids (RL)', stock: 450, threshold: 100, status: 'ok' },
    ];
    inventory.forEach(inv => {
      const ref = doc(collection(db, 'inventory'), inv.id);
      batch.set(ref, inv);
    });

    // 3. Seed Patient Queue
    const patients = [
      { id: 'PAT_101', name: 'Rahul Sharma', age: 34, reason: 'High Fever & Cough', status: 'waiting', time: '10:15 AM' },
      { id: 'PAT_102', name: 'Priya Patel', age: 28, reason: 'Routine Checkup', status: 'in-progress', time: '10:30 AM' },
      { id: 'PAT_103', name: 'Amit Kumar', age: 45, reason: 'Follow-up (Diabetes)', status: 'waiting', time: '11:00 AM' },
      { id: 'PAT_104', name: 'Sunita Devi', age: 60, reason: 'Joint Pain', status: 'completed', time: '09:30 AM' },
    ];
    patients.forEach(pat => {
      const ref = doc(collection(db, 'patients'), pat.id);
      batch.set(ref, pat);
    });

    await batch.commit();
    alert("Database Seeded Successfully!");
  } catch (error) {
    console.error("Error seeding database: ", error);
    alert("Error seeding database. Check console.");
  }
};
