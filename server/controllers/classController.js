const { Class } = require('../models/Class');
const { Role } = require('../models/Role');

// Get all classes with the respective user and role
exports.getAllClasses = async (req, res) => {
    const user = req.user;
    try {
        const role = await Role.findById(user.role);
        let classes = [];
        if (role.name === 'Student') {
            classes = await Class.find({
                students: { $elemMatch: { user: user.email } },
            });
        } else if (role.name === 'Teacher') {
            classes = await Class.find({ admin: user._id });
        } else {
            throw 'Unauthorized User';
        }
        res.json({ classes });
    } catch (e) {
        res.json({ error: e || 'Something went wrong!' });
    }
};
exports.getClassById = async (req, res) => {
    try {
        const cls = await Class.findById(req.params.id);
        if (!cls) throw 'Class unavailable';
        res.json({ class: cls });
        return;
    } catch (e) {
        res.json({ error: e || 'Something went wrong!' });
    }
};

// Add a new class
exports.addClass = async (req, res) => {
    const user = req.user;
    try {
        const newClass = new Class({
            title: req.body.title,
            books: req.body.books,
            link: req.body.link,
            admin: user._id,
            students: req.body.students,
        });
        await newClass.save();
        res.json({ success: 'Added class successfully' });
    } catch (e) {
        res.json({ error: e || 'Something went wrong!' });
    }
};

// Update and existing class
exports.updateClass = async (req, res) => {
    try {
        const cls = await Class.findById(req.params.id);
        if (!cls) throw 'Class unavailable';
        await Class.findByIdAndUpdate(req.params.id, {
            title: req.body.title || cls.title,
            books: req.body.books || cls.books,
            link: req.body.link || cls.link,
            students: req.body.students || cls.students,
        });
        res.json({ success: 'Added class successfully' });
        return;
    } catch (e) {
        res.json({ error: e || 'Something went wrong!' });
    }
};

// Join a class by class code
exports.joinUser = async (req, res) => {
    const user = req.user;
    try {
        const cls = await Class.findById(req.params.id);
        if (!cls) throw 'Class unavailable';
        if (user.email in cls.students.map((stud) => stud.user)) {
            res.json({ error: 'Already a student of the class' });
            return;
        }
        await Class.updateOne(
            { _id: cls._id },
            { $push: { students: user.email } }
        );
        res.json({ success: 'Student added to the class' });
    } catch (e) {
        res.json({ error: e || 'Something went wrong!' });
    }
};
