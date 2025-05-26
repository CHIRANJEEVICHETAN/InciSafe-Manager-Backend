const express = require('express');
const admin = require("firebase-admin");
require('dotenv').config(); // Load environment variables

// Initialize Firebase Admin SDK using environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
// Fix the private key by replacing escaped newlines with actual newlines
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
app.use(express.json());

const departments = ["HR", "Engineering", "Sales", "Marketing", "IT", "Finance", "Legal", "Operations", "Customer Service", "Research and Development", "Product Management"];
const employees = [
  "Rajesh Kumar - 1001",
  "Priya Sharma - 1002",
  "Amit Singh - 1003",
  "Sneha Patel - 1004",
  "Vikram Gupta - 1005",
  "Kavya Reddy - 1006",
  "Arjun Nair - 1007",
  "Meera Joshi - 1008",
  "Rohit Agarwal - 1009",
  "Ananya Iyer - 1010",
  "Karan Malhotra - 1011",
  "Divya Chopra - 1012",
  "Siddharth Rao - 1013",
  "Riya Bansal - 1014",
  "Aditya Verma - 1015",
  "Pooja Mishra - 1016",
  "Nikhil Saxena - 1017",
  "Shreya Kapoor - 1018",
  "Varun Tiwari - 1019",
  "Ishita Bhatt - 1020",
  "Manish Pandey - 1021",
  "Neha Srivastava - 1022",
];
const severity = ["minor", "moderate", "severe"];
const incidentCategories = ["BehaviourIncident", "ChemicalIncident", "EnvironmentalHazard", "EquipmentIssues", "FireIncident", "HealthSafety",
  "PolicyViolation", "WeatherHazards", "uniformSafety"];

  let deviceCounter = 1; // Initialize a counter for device IDs

  // Endpoint to get departments
  app.get("/departments", (req, res) => {
    res.json(departments);
  });

  app.get("/incidentCategories", (req, res) => {
    res.json(incidentCategories);
  });

  // Endpoint to get employees
  app.get("/employees", (req, res) => {
    res.json(employees);
  });

  // Endpoint to get severity levels
  app.get("/severity", (req, res) => {
    res.json(severity);
  });

  // Endpoint to delete a user
  app.post("/deleteUser", async (req, res) => {
    const { uid } = req.body;
    try {
      await admin.auth().deleteUser(uid);
      console.log(`Successfully deleted user with UID: ${uid}`);
      res.status(200).send({ message: `User ${uid} deleted successfully` });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).send({ error: "Failed to delete user" });
    }
  });

app.post('/sendNotification', async (req, res) => {
    const { title, body, date, username, userId } = req.body;

    try {
      // Fetch all FCM tokens from Firestore
      const tokensSnapshot = await db.collection("FCMTokens").get();
      const tokens = tokensSnapshot.docs.map(doc => doc.data()["FCM Token"]);

      if (tokens.length === 0) {
        return res.status(404).send({ error: 'No FCM tokens found' });
      }

      // Send notifications to all tokens
      const response = await admin.messaging().sendEachForMulticast({
        tokens: tokens,
        notification: { title, body },
      });

      console.log("Notifications sent successfully:", response.successCount);

      // Reference to the user’s notifications subcollection
      const userNotificationsRef = db.collection("notifications").doc(userId).collection("userNotifications");

      // Reference to the adminNotifications collection
      const adminNotificationsRef = db.collection("adminNotifications");

      // Create a new document for each notification in both collections
      const notificationData = {
        title,
        body,
        date,
        username,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };

      await userNotificationsRef.add(notificationData); // Save to user-specific notifications
      await adminNotificationsRef.add(notificationData); // Save to adminNotifications

      console.log("Notification document created in Firestore for user:", userId, notificationData);
      res.status(200).send({ message: 'Notifications sent successfully', response });
    } catch (error) {
      console.error('Error sending notifications:', error);
      res.status(500).send({ error: 'Failed to send notifications', message: error });
    }
  });

  // Endpoint to receive and store FCM tokens
app.post('/storeFCMToken', async (req, res) => {
  const { token, uid } = req.body;
    try {
      if (!uid) {
        return res.status(400).send({ error: 'User ID is required' });
      }

      // Store the token under the user's UID
      const userTokenRef = db.collection("FCMTokens").doc(uid);
      const userTokenDoc = await userTokenRef.get();

      if (userTokenDoc.exists) {
        console.log(`FCM Token already exists for user: ${uid}`);
      } else {
        await userTokenRef.set({ "FCM Token": token });
        console.log(`Stored new FCM Token for user: ${uid}`);
      }

      res.status(200).send({ message: 'FCM Token processed successfully' });
    } catch (error) {
      console.error('Error processing FCM Token:', error);
      res.status(500).send({ error: 'Failed to process FCM Token' });
    }
  });

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
