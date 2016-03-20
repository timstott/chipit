/**
 * Listens to create Jira comment events.
 * Adds a Jira comment with the feature review URL without submitting it.
 */
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === "create_jira_comment") {
    var featureReviewURL = message.featureReviewURL;
    var response;

    var addCommentNode = $('#comment-issue');
    var commentTextAreaNode = $('#comment-wiki-edit textarea');
    var submitCommentNode = $('#issue-comment-add-submit');
    var commentLinkNodes = $('.activity-comment a');
    var comment = "[Feature ready for review|" + featureReviewURL + "]";

    // Add all URLs found in comments to a Set
    var commentsURLs = commentLinkNodes.reduce(function (memo, node) {
      return memo.add($(node).attr('href'));
    }, (new Set()))

    if (commentsURLs.has(featureReviewURL)) {
      sendResponse({
        action: 'failed_to_create_jira_comment',
        reason: 'Identical feature review already submitted'
      });
      return;
    }

    addCommentNode.click();
    commentTextAreaNode.text(comment);
    if (commentTextAreaNode.text() === comment) {
      sendResponse({
        action: 'jira_comment_created'
      });
    } else {
      sendResponse({
        action: 'failed_to_create_jira_comment',
        reason: 'Failed to create a Jira comment'
      });
    }
  }
});

/**
 * Listen to submit Jira comment events
 */
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === "submit_jira_comment") {
    var response;

    var submitCommentNode = $("#issue-comment-add-submit");
    submitCommentNode.click();

    sendResponse({
      action: "jira_comment_submitted"
    });
  }
});
