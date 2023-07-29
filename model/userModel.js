const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "a name is required for a new user"]
    },
    email: {
        type: String,
        required: [true, "an email is required for a new user"],
        validate: [validator.isEmail, "Please provide a valid email"],
        unique: true,
        lowerCase: true
    },
    photo: {
        type: String,
        default: "default.jpg"
    },
    role: {
        type: String,
        enum: ['user', 'tourGuide', 'lead-guide', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, "a password is required for a new user"],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, "a passwordConfirm is needed"],
        validate: {
            //only works on CREATE and SAVE
            validator: function(str) {
                return str === this.password;
            },
            message: "two password entered are not same"
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetTokenExpired: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;

    next();
});

userSchema.pre("save", function(next) {
    if (!this.isModified("password") || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function(next) {
    this.find({ active: { $ne: false } });
    next();
});


userSchema.methods.correctPassword = async (passwordEntered, authPassword) => {
    return await bcrypt.compare(passwordEntered, authPassword);
}

userSchema.methods.ifChangedPassword = async function(JWTTimestamep) {
    if (this.passwordChangedAt) {
        const changedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return changedAt > JWTTimestamep;
    }
    return false;
}

userSchema.methods.createResetPasswordToken = async function() {
    const token = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
    this.passwordResetTokenExpired = Date.now() + 10 * 60 * 1000;

    return token;
}

module.exports = mongoose.model("User", userSchema);