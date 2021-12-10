const friendShipStatusEnum = {
	FRIEND: "FRIEND", //arkadaşın
    REQUEST_SENT: "REQUEST_SENT", //istek atmışsın
	PENDING: "PENDING", //karşıdan istek gelmiş
	NONE: "NONE" //hiçbir alaka yok
}

const checkFriendshipStatus = (user, otherUserId) => {
    let friendShipStatus = '';

    if(user.friends.includes(otherUserId)){ //arkadas mi
        friendShipStatus = friendShipStatusEnum.FRIEND
    }else if(user.pendingFriendRequests.includes(otherUserId)){ //o istek atmis mi
        friendShipStatus = friendShipStatusEnum.PENDING
    }else if(user.sentFriendRequests.includes(otherUserId)){ //biz istek atmis miyiz
        friendShipStatus = friendShipStatusEnum.REQUEST_SENT
    }else {
        friendShipStatus = friendShipStatusEnum.NONE
    }

    return friendShipStatus;
}

module.exports = checkFriendshipStatus
