const express = require("express");
const router = express.Router();
const Restaurant = require("../models/Restaurant");

// GET all restaurants
router.get("/", async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET single restaurant by ID
router.get("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json(restaurant);
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST create new restaurant (for admin)
router.post("/", async (req, res) => {
  try {
    const {
      name,
      cuisine,
      rating,
      deliveryTime,
      image,
      description,
      deliveryFee,
      minOrder,
      areas
    } = req.body;

    // Make some fields optional with defaults
    if (!name || !cuisine || !rating || !deliveryTime || !image || !description) {
      return res.status(400).json({ message: "Required fields: name, cuisine, rating, deliveryTime, image, description" });
    }

    // Ensure areas is an array
    let areasArray = [];
    if (areas) {
      if (Array.isArray(areas)) {
        areasArray = areas;
      } else if (typeof areas === 'string') {
        // Split by comma and trim each area
        areasArray = areas.split(',').map(area => area.trim()).filter(area => area);
      }
    }

    const restaurant = new Restaurant({
      name,
      cuisine,
      rating,
      deliveryTime,
      image,
      description,
      deliveryFee: deliveryFee || 2.99,
      minOrder: minOrder || 0,
      areas: areasArray
    });

    console.log('Creating restaurant:', restaurant);
    await restaurant.save();
    console.log('Restaurant saved successfully:', restaurant._id);
    
    const restaurantData = restaurant.toObject();
    restaurantData._id = restaurantData._id.toString();
    res.status(201).json(restaurantData);
  } catch (error) {
    console.error("Error creating restaurant:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT update restaurant (for admin)
router.put("/:id", async (req, res) => {
  try {
    const { name, cuisine, rating, deliveryTime, image, description, deliveryFee, minOrder, areas } = req.body;
    
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    if (name) restaurant.name = name;
    if (cuisine) restaurant.cuisine = cuisine;
    if (rating !== undefined) restaurant.rating = rating;
    if (deliveryTime) restaurant.deliveryTime = deliveryTime;
    if (image) restaurant.image = image;
    if (description) restaurant.description = description;
    if (deliveryFee !== undefined) restaurant.deliveryFee = deliveryFee;
    if (minOrder !== undefined) restaurant.minOrder = minOrder;
    if (areas !== undefined) restaurant.areas = areas;

    await restaurant.save();
    const restaurantData = restaurant.toObject();
    restaurantData._id = restaurantData._id.toString();
    res.json(restaurantData);
  } catch (error) {
    console.error("Error updating restaurant:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE restaurant (for admin)
router.delete("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    await Restaurant.findByIdAndDelete(req.params.id);
    res.json({ message: "Restaurant deleted successfully" });
  } catch (error) {
    console.error("Error deleting restaurant:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;



