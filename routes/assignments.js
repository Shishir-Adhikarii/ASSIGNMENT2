const express = require('express');
const router = express.Router();

const Assignment = require('../models/Assignment');
const { ensureAuthenticated } = require('../middleware/auth');

// =====================================================
// PUBLIC READ-ONLY DIRECTORY + KEYWORD SEARCH
// =====================================================
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
    console.error('Public assignments error:', error);

    res.status(500).render('error', {
      message: 'Unable to load assignments.'
    });
  }
});

// =====================================================
// PRIVATE ASSIGNMENT LIST
// =====================================================
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
    console.error('My assignments error:', error);

    res.status(500).render('error', {
      message: 'Unable to load your assignments.'
    });
  }
});

// =====================================================
// CREATE
// =====================================================

// Show add form
router.get('/add/new', ensureAuthenticated, (req, res) => {
  res.render('assignments/add', {
    title: 'Add Assignment'
  });
});

// Create assignment
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
      title: title.trim(),
      course: course.trim(),
      description: description.trim(),
      dueDate,
      priority,
      status,
      createdBy: req.user._id
    });

    res.redirect('/assignments/my');
  } catch (error) {
    console.error('Create assignment error:', error);

    res.render('assignments/add', {
      title: 'Add Assignment',
      error: 'Unable to create assignment.',
      assignment: req.body
    });
  }
});

// =====================================================
// EDIT
// =====================================================

// Show edit form
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

    assignment.formattedDueDate =
      assignment.dueDate.toISOString().split('T')[0];

    res.render('assignments/edit', {
      title: 'Edit Assignment',
      assignment
    });
  } catch (error) {
    console.error('Edit form error:', error);

    res.status(404).render('error', {
      message: 'Assignment not found.'
    });
  }
});

// Update assignment
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

    if (!title || !course || !description || !dueDate) {
      return res.status(400).render('error', {
        message: 'Please complete all required fields.'
      });
    }

    const assignment = await Assignment.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user._id
      },
      {
        title: title.trim(),
        course: course.trim(),
        description: description.trim(),
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
    console.error('Update assignment error:', error);

    res.status(400).render('error', {
      message: 'Unable to update assignment.'
    });
  }
});

// =====================================================
// DELETE
// =====================================================

// Delete confirmation page
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
    console.error('Delete confirmation error:', error);

    res.status(404).render('error', {
      message: 'Assignment not found.'
    });
  }
});

// Delete assignment
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const deletedAssignment = await Assignment.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!deletedAssignment) {
      return res.status(404).render('error', {
        message: 'Assignment not found.'
      });
    }

    res.redirect('/assignments/my');
  } catch (error) {
    console.error('Delete assignment error:', error);

    res.status(500).render('error', {
      message: 'Unable to delete assignment.'
    });
  }
});

// =====================================================
// PRIVATE DETAILS
// Keep the generic /:id route near the bottom
// =====================================================
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

    assignment.formattedDueDate =
      assignment.dueDate.toLocaleDateString();

    res.render('assignments/details', {
      title: assignment.title,
      assignment
    });
  } catch (error) {
    console.error('Assignment details error:', error);

    res.status(404).render('error', {
      message: 'Assignment not found.'
    });
  }
});

module.exports = router;