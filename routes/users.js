const express = require('express');
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/users');

const User = require('../models/User');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router({ mergeParams: true });


// Any route below this will required logged in user
router.use(protect);
// Any route below this will require user as an admin
router.use(authorize('admin'));

router
.route('/')
    .get(advancedResults(User), getUsers)
    .post(createUser)

router
.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser)

module.exports = router;
