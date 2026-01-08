const express = require("express");
const router = express.Router();
const Menu = require("../models/Menu");
const Restaurant = require("../models/Restaurant");

// GET menu items for a restaurant
router.get("/restaurant/:restaurantId", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const restaurantId = req.params.restaurantId;
    
    console.log("🔍 Querying menu items for restaurant:", restaurantId);
    
    // Build query to match restaurantId as both string and ObjectId
    const restaurantIdConditions = [restaurantId]; // Always try as string
    
    // Also try as ObjectId if it's a valid ObjectId format
    if (mongoose.Types.ObjectId.isValid(restaurantId)) {
      try {
        const objectId = new mongoose.Types.ObjectId(restaurantId);
        restaurantIdConditions.push(objectId);
        console.log("Added ObjectId condition:", objectId.toString());
      } catch (e) {
        console.log("Could not convert to ObjectId:", e.message);
      }
    }
    
    // Find menu items for the restaurant
    const finalQuery = {
      restaurantId: { $in: restaurantIdConditions }
    };
    
    // Optionally filter by available status (if query param is provided)
    if (req.query.includeUnavailable !== 'true') {
      finalQuery.available = { $ne: false }; // Show items where available is true or undefined
    }
    
    console.log("Query:", JSON.stringify(finalQuery, null, 2));
    
    // Try the query - use lean() to get plain objects and ensure _id is included
    let menuItems = await Menu.find(finalQuery).sort({ name: 1 }).lean();
    console.log(`Found ${menuItems.length} menu items with query`);
    
    // Log sample item to debug
    if (menuItems.length > 0) {
      console.log("Sample menu item from DB:", menuItems[0]);
    }
    
    // If no items found, try without the available filter
    if (menuItems.length === 0 && req.query.includeUnavailable !== 'true') {
      const queryWithoutAvailable = { restaurantId: { $in: restaurantIdConditions } };
      console.log("Trying without available filter...");
      menuItems = await Menu.find(queryWithoutAvailable).sort({ name: 1 }).lean();
      console.log(`Found ${menuItems.length} items without available filter`);
    }
    
    // If still no items, try direct ObjectId match
    if (menuItems.length === 0 && mongoose.Types.ObjectId.isValid(restaurantId)) {
      try {
        const directQuery = { restaurantId: new mongoose.Types.ObjectId(restaurantId) };
        console.log("Trying direct ObjectId match...");
        menuItems = await Menu.find(directQuery).sort({ name: 1 }).lean();
        console.log(`Found ${menuItems.length} items with direct ObjectId match`);
      } catch (e) {
        console.log("Direct ObjectId match failed:", e.message);
      }
    }
    
    console.log(`✅ Returning ${menuItems.length} menu items`);
    // Ensure _id is included and converted to string for all items
    const menuItemsData = menuItems.map(item => {
      // Since we used .lean(), items are already plain objects
      // But ensure _id exists and is converted to string
      if (item._id) {
        item._id = item._id.toString ? item._id.toString() : String(item._id);
      }
      return item;
    });
    
    if (menuItemsData.length > 0) {
      console.log("Sample menu item being returned:", menuItemsData[0]);
      console.log("Sample menu item _id:", menuItemsData[0]._id);
    }
    
    res.json(menuItemsData);
  } catch (error) {
    console.error("❌ Error fetching menu items:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET single menu item by ID (must come before /:id routes)
router.get("/item/:id", async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    const menuItemData = menuItem.toObject();
    menuItemData._id = menuItemData._id.toString();
    res.json(menuItemData);
  } catch (error) {
    console.error("Error fetching menu item:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST create new menu item (for admin)
router.post("/", async (req, res) => {
  try {
    const { restaurantId, name, description, price, image, available } = req.body;

    if (!restaurantId || !name || !description || !price || !image) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Convert restaurantId to ObjectId if it's a valid ObjectId string
    const mongoose = require("mongoose");
    let restaurantIdToUse = restaurantId;
    
    if (mongoose.Types.ObjectId.isValid(restaurantId)) {
      restaurantIdToUse = new mongoose.Types.ObjectId(restaurantId);
    }

    // Verify restaurant exists
    const restaurant = await Restaurant.findById(restaurantIdToUse);
    if (!restaurant) {
      // Try finding by string ID as fallback
      const restaurantByString = await Restaurant.findOne({ _id: restaurantId });
      if (!restaurantByString) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      restaurantIdToUse = restaurantByString._id;
    } else {
      restaurantIdToUse = restaurant._id;
    }

    const menuItem = new Menu({
      restaurantId: restaurantIdToUse,
      name,
      description,
      price,
      image,
      available: available !== undefined ? available : true
    });

    await menuItem.save();
    const menuItemData = menuItem.toObject();
    menuItemData._id = menuItemData._id.toString();
    res.status(201).json(menuItemData);
  } catch (error) {
    console.error("Error creating menu item:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT update menu item (for admin)
router.put("/:id", async (req, res) => {
  try {
    const { name, description, price, image, available } = req.body;
    
    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    if (name) menuItem.name = name;
    if (description) menuItem.description = description;
    if (price !== undefined) menuItem.price = price;
    if (image) menuItem.image = image;
    if (available !== undefined) menuItem.available = available;

    await menuItem.save();
    const menuItemData = menuItem.toObject();
    menuItemData._id = menuItemData._id.toString();
    res.json(menuItemData);
  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE menu item (for admin)
router.delete("/:id", async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    await Menu.findByIdAndDelete(req.params.id);
    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET all menu items (for admin) - must be last GET route
router.get("/", async (req, res) => {
  try {
    const menuItems = await Menu.find().sort({ createdAt: -1 }).lean();
    const menuItemsData = menuItems.map(item => {
      if (item._id) {
        item._id = item._id.toString ? item._id.toString() : String(item._id);
      }
      return item;
    });
    res.json(menuItemsData);
  } catch (error) {
    console.error("Error fetching all menu items:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

