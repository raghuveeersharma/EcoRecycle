import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const locationDetection = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res
        .status(400)
        .json({ error: "Latitude and Longitude are required" });
    }

    const apiKey = process.env.GOMAPS_PRO_API_KEY; // Make sure this is set in .env
    const keyword = "recycling"; // Searching for recycling centers
    const radius = 5000; // Search within 5km

    const url = `https://maps.gomaps.pro/maps/api/place/nearbysearch/json?location=${lat},${lon}&name=${keyword}&radius=${radius}&key=${apiKey}`;

    console.log("Fetching from URL:", url); // Debugging line

    const response = await axios.get(url);

    // Check if response contains data
    if (response.data && response.data.results) {
      res.json(response.data.results); // Send results to frontend
    } else {
      res.status(404).json({ error: "No recycling centers found" });
    }
  } catch (error) {
    console.error(
      "Error fetching recycling centers:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch recycling locations" });
  }
};
