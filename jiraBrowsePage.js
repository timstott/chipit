// Adds a comment on the issue and populates with the feature review URL
var draftComment = function (featureReviewURL) {
  var addCommentElem = $('#comment-issue');
  var commentTextAreaElem = $('#comment-wiki-edit textarea');
  var submitElem = $('#issue-comment-add-submit');

  addCommentElem.click();
  commentTextAreaElem.text(featureReviewURL);
  if (commentTextAreaElem.text() === featureReviewURL) {
    submitElem.click();
    return true;
  } else {
    console.error("Unable to add a comment with the feature review URL");
    return false;
  }
}

// Drat comment event handler
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('Message received: ' + JSON.stringify(message))
  if (message.action === "featureReviewDraft.start") {
    var featureReviewURL = message.featureReviewURL;
    var draftCommentSuccessful = draftComment(featureReviewURL);
    var response;

    if (draftCommentSuccessful) {
      response = { action: "featureReviewDraft.success" };
    } else {
      response = { action: "featureReviewDraft.failed" };
    }

    sendResponse(response);
  }
});
