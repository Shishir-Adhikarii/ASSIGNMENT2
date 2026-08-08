const express = require('express');
const router = express.Router();

const Assignment = require('../models/Assignment');
const { ensureAuthenticated } = require('../middleware/auth');

// PUBLIC READ-ONLY DIRECTORY + SEARCH
router.get('/', async (req, res) => {
    try {
        const search = (req.query.search || '').trim();

        let query = {};

        if (search) {
            const regex = new RegExp(search, 'i');

            query = {
                $or: [
                    { title: regex },
                    { course: regex },
                    { description: regex },
                    { priority: regex },
                    { status: regex }
                ]
            };
        }

        const assignments = await Assignment.find(query)
            .populate('createdBy', 'username')
            .sort({ dueDate: 1 });

        res.render('assignments/index', {
            title: 'Assignment Directory',
            assignments,
            search
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {
            message: 'Unable to load assignments.'
        });
    }
});

// PRIVATE LIST
router.get('/my', ensureAuthenticated, async (req, res) => {
    try {
        const assignments = await Assignment.find({
            createdBy: req.user._id
        }).sort({ dueDate: 1 });

        res.render('assignments/my', {
            title: 'My Assignments',
            assignments
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {
            message: 'Unable to load your assignments.'
        });
    }
});

// PRIVATE DETAILS
router.get('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const assignment = await Assignment.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        }).populate('createdBy', 'username');

        if (!assignment) {
            return res.status(404).render('error', {
                message: 'Assignment not found.'
            });
        }

        res.render('assignments/details', {
            title: assignment.title,
            assignment
        });
    } catch (error) {
        res.status(404).render('error', {
            message: 'Assignment not found.'
        });
    }
});

// CREATE FORM
router.get('/add/new', ensureAuthenticated, (req, res) => {
    res.render('assignments/add', {
        title: 'Add Assignment'
    });
});

// CREATE
router.post('/', ensureAuthenticated, async (req, res) => {
    try {
        const {
            title,
            course,
            description,
            dueDate,
            priority,
            status
        } = req.body;

        if (!title || !course || !description || !dueDate) {
            return res.render('assignments/add', {
                title: 'Add Assignment',
                error: 'Please complete all required fields.',
                assignment: req.body
            });
        }

        await Assignment.create({
            title,
            course,
            description,
            dueDate,
            priority,
            status,
            createdBy: req.user._id
        });

        res.redirect('/assignments/my');
    } catch (error) {
        console.error(error);

        res.render('assignments/add', {
            title: 'Add Assignment',
            error: 'Unable to create assignment.',
            assignment: req.body
        });
    }
});

// EDIT FORM
router.get('/:id/edit', ensureAuthenticated, async (req, res) => {
    try {
        const assignment = await Assignment.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!assignment) {
            return res.status(404).render('error', {
                message: 'Assignment not found.'
            });
        }

        res.render('assignments/edit', {
            title: 'Edit Assignment',
            assignment
        });
    } catch (error) {
        res.status(404).render('error', {
            message: 'Assignment not found.'
        });
    }
});

// UPDATE
router.put('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const {
            title,
            course,
            description,
            dueDate,
            priority,
            status
        } = req.body;

        const assignment = await Assignment.findOneAndUpdate(
            {
                _id: req.params.id,
                createdBy: req.user._id
            },
            {
                title,
                course,
                description,
                dueDate,
                priority,
                status
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!assignment) {
            return res.status(404).render('error', {
                message: 'Assignment not found.'
            });
        }

        res.redirect(`/assignments/${assignment._id}`);
    } catch (error) {
        console.error(error);

        res.status(400).render('error', {
            message: 'Unable to update assignment.'
        });
    }
});

// DELETE CONFIRMATION PAGE
router.get('/:id/delete', ensureAuthenticated, async (req, res) => {
    try {
        const assignment = await Assignment.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!assignment) {
            return res.status(404).render('error', {
                message: 'Assignment not found.'
            });
        }

        res.render('assignments/delete', {
            title: 'Delete Assignment',
            assignment
        });
    } catch (error) {
        res.status(404).render('error', {
            message: 'Assignment not found.'
        });
    }
});

// DELETE
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const deleted = await Assignment.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!deleted) {
            return res.status(404).render('error', {
                message: 'Assignment not found.'
            });
        }

        res.redirect('/assignments/my');
    } catch (error) {
        res.status(500).render('error', {
            message: 'Unable to delete assignment.'
        });
    }
});

module.exports = router;