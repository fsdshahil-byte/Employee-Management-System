const express = require("express");

const router = express.Router();
const auth = require("../middleware/auth");
const Message = require("../models/Message");
const User = require("../models/User");
const Employee = require("../models/Employee");

const getUserProfile = async (userId) => {
  const user = await User.findById(userId).lean();

  if (!user) return null;

  const employee = await Employee.findOne({ userId: user._id }).lean();

  return {
    userId: String(user._id),
    role: user.role,
    email: user.email,
    name:
      employee?.name ||
      user.email?.split("@")[0]?.replace(/[._-]/g, " ") ||
      user.role,
    image: employee?.image || "",
    designation: employee?.designation || "",
    department: employee?.department || "",
  };
};

router.get("/contacts", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).lean();

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const targetRole = currentUser.role === "manager" ? "employee" : "manager";
    const users = await User.find({ role: targetRole }).lean();

    const contacts = await Promise.all(
      users.map(async (user) => {
        const employee = await Employee.findOne({ userId: user._id }).lean();

        return {
          userId: String(user._id),
          role: user.role,
          email: user.email,
          name:
            employee?.name ||
            user.email?.split("@")[0]?.replace(/[._-]/g, " ") ||
            user.role,
          image: employee?.image || "",
          designation: employee?.designation || "",
          department: employee?.department || "",
        };
      })
    );

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/conversation/:otherUserId", auth, async (req, res) => {
  try {
    const { otherUserId } = req.params;

    const messages = await Message.find({
      $or: [
        {
          senderUserId: req.user.id,
          recipientUserId: otherUserId,
        },
        {
          senderUserId: otherUserId,
          recipientUserId: req.user.id,
        },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { recipientUserId, text } = req.body;

    if (!recipientUserId || !text?.trim()) {
      return res
        .status(400)
        .json({ message: "Recipient and message text are required" });
    }

    const senderProfile = await getUserProfile(req.user.id);
    const recipientProfile = await getUserProfile(recipientUserId);

    if (!senderProfile || !recipientProfile) {
      return res.status(404).json({ message: "Chat participant not found" });
    }

    const message = await Message.create({
      senderUserId: senderProfile.userId,
      senderRole: senderProfile.role,
      senderName: senderProfile.name,
      senderImage: senderProfile.image,
      recipientUserId: recipientProfile.userId,
      recipientRole: recipientProfile.role,
      recipientName: recipientProfile.name,
      recipientImage: recipientProfile.image,
      text: text.trim(),
    });

    req.app.get("io")?.emit("messageUpdated", {
      senderUserId: senderProfile.userId,
      recipientUserId: recipientProfile.userId,
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:messageId", auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (String(message.senderUserId) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only edit your own messages" });
    }

    message.text = text.trim();
    message.isEdited = true;
    await message.save();

    req.app.get("io")?.emit("messageUpdated", {
      senderUserId: String(message.senderUserId),
      recipientUserId: String(message.recipientUserId),
    });

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:messageId", auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (String(message.senderUserId) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    await Message.findByIdAndDelete(messageId);

    req.app.get("io")?.emit("messageUpdated", {
      senderUserId: String(message.senderUserId),
      recipientUserId: String(message.recipientUserId),
    });

    res.json({ message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
