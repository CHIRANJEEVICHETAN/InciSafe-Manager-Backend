const express = require('express');
const admin = require("firebase-admin");
require('dotenv').config(); // Load environment variables

// Initialize Firebase Admin SDK using environment variable
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
});

const db = admin.firestore();
const app = express();
app.use(express.json());

const departments = ["HR", "Engineering", "Sales", "Marketing"];
const employees = [
  "John Doe - 1001",
  "Jane Smith - 1002",
  "Alice Johnson - 1003",
  "Bob Brown - 1004",
];
const severity = ["minor", "moderate", "severe"];
const incidentCategories = ["BehaviourIncident", "ChemicalIncident", "EnvironmentalHazard", "EquipmentIssues", "FireIncident", "HealthSafety",
  "PolicyViolation", "WeatherHazards", "uniformSafety"];

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
  const message = {
    notification: { title, body },
    topic: "all_users",
  };

  try {
    // Send the notification
    const response = await admin.messaging().send(message);

    console.log("Notification sent successfully:", response);

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

    await userNotificationsRef.add(notificationData);
    await adminNotificationsRef.add(notificationData);

    console.log("Notification data saved to Firestore successfully.");
    res.status(200).send("Notification sent and saved to Firestore successfully.");
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).send("Error sending notification");
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
