const friendShipStatusEnum = {
    FRIEND: "FRIEND", // Already friend
    REQUEST_SENT: "REQUEST_SENT", // Already sent a request 
    PENDING: "PENDING", // Have a pending request from the profile you are viewing
    NONE: "NONE"
}

const checkFriendshipStatus = (user, otherUserId) => {
    let friendShipStatus = '';

    if (user.friends.includes(otherUserId)) {
        friendShipStatus = friendShipStatusEnum.FRIEND
    } else if (user.pendingFriendRequests.includes(otherUserId)) {
        friendShipStatus = friendShipStatusEnum.PENDING
    } else if (user.sentFriendRequests.includes(otherUserId)) {
        friendShipStatus = friendShipStatusEnum.REQUEST_SENT
    } else {
        friendShipStatus = friendShipStatusEnum.NONE
    }

    return friendShipStatus;
}

module.exports = checkFriendshipStatus
