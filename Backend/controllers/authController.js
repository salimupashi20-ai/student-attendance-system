const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const registerUser = async (req, res) => {
    try {
        const {
            full_name,
            student_number,
            staff_id,
            password,
            role
        } = req.body;

        // Validate identifier based on role
        if (role === "student" && !student_number) {
            return res.status(400).json({
                message: "Student number is required for students."
            });
        }

        if ((role === "lecturer" || role === "admin") && !staff_id) {
            return res.status(400).json({
                message: "Staff ID is required for lecturers and admins."
            });
        }

        const checkQuery = `
            SELECT * FROM users
            WHERE student_number = ?
            OR staff_id = ?
        `;

        db.query(
            checkQuery,
            [student_number || null, staff_id || null],
            async (err, results) => {
                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (results.length > 0) {
                    return res.status(400).json({
                        message: "User already exists."
                    });
                }

                const hashedPassword = await bcrypt.hash(password, 10);

                const insertQuery = `
                    INSERT INTO users
                    (full_name, student_number, staff_id, password, role)
                    VALUES (?, ?, ?, ?, ?)
                `;

                db.query(
                    insertQuery,
                    [
                        full_name,
                        student_number || null,
                        staff_id || null,
                        hashedPassword,
                        role
                    ],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({
                                error: err.message
                            });
                        }

                        res.status(201).json({
                            message: "User registered successfully",
                            userId: result.insertId
                        });
                    }
                );
            }
        );

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                message: "Identifier and password are required."
            });
        }

        const query = `
            SELECT * FROM users
            WHERE student_number = ?
            OR staff_id = ?
        `;

        db.query(
            query,
            [identifier, identifier],
            async (err, results) => {
                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (results.length === 0) {
                    return res.status(401).json({
                        message: "Invalid identifier or password."
                    });
                }

                const user = results[0];

                const isMatch = await bcrypt.compare(
                    password,
                    user.password
                );

                if (!isMatch) {
                    return res.status(401).json({
                        message: "Invalid identifier or password."
                    });
                }

                const token = jwt.sign(
                    {
                        id: user.id,
                        role: user.role
                    },
                    process.env.JWT_SECRET,
                    {
                        expiresIn: "24h"
                    }
                );

                res.status(200).json({
                    message: "Login successful",
                    token,
                    user: {
                        id: user.id,
                        full_name: user.full_name,
                        student_number: user.student_number,
                        staff_id: user.staff_id,
                        role: user.role
                    }
                });
            }
        );

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser
};
