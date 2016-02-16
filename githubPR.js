var shipItSquirrelNode = $('<img class="emoji" title=":shipit:" alt=":shipit:" src="https://assets-cdn.github.com/images/icons/emoji/shipit.png" height="20" width="20" align="absmiddle">')

var trackerLinkNodes = $('.build-statuses-list a[href*="feature_reviews"]');
var commitMessagesNodes = $('.commit-message a');

// Extract references from commit mess
/**
 * Listen to GitHub pull request page analysis events
 */
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  var featureReviewURL;
  if (message.action === "analyse_github_pull_request") {

    featureReviewURL = trackerLinkNodes.first().attr("href");
    if (!featureReviewURL) {
      console.log("Could not find feature review URL!");
      return false;
    }

    var ticketReferences = commitMessagesNodes.reduce(function (acc, node) {
      var TICKET_REFERENCE = /^\[?([A-Z]+-\d+)\]?/;
      var matches = node.text.match(TICKET_REFERENCE);
      // Get the first matching group only
      var reference = (matches || [])[1]

      if (reference && acc.includes(reference) == false) {
        acc.push(matches[1]);
      }
      return acc;
    }, []);

    if (ticketReferences.length === 0) {
      console.log("No ticket reference found in commit messages!")
      return false;
    }

    // Insert Chipt It button on page
    var chipItNodes = ticketReferences.map(function (reference) {
      var parentNode = $('<div>');
      var errorMessageNode = $('<span>');
      var confirmationButtonNode = $('<a>').text('Confirm').hide();

      var chipItButtonNode = $('<a>')
            .text(reference + " Chip It!")
            .addClass("btn btn-outline")
            .on("click", function(event) {
              var thatNode = $(this);
              event.preventDefault();
              chrome.runtime.sendMessage({
                action: "create_jira_comment",
                reference: reference,
                featureReviewURL: featureReviewURL
              }, function (response) {
                if (response.action === "failed_to_create_jira_comment") {
                  errorMessageNode.text(response.reason);
                } else if (response.action === "jira_comment_created") {
                  confirmationButtonNode
                    .on("click", function (event) {
                      event.preventDefault();
                      chrome.runtime.sendMessage({
                        action: "submit_jira_comment",
                        jiraTabId: response.jiraTabId
                      }, function (response) {
                        if (response.action === "jira_comment_submitted") {
                          parentNode.append(shipItSquirrelNode);
                          confirmationButtonNode.hide();
                        }
                      });
                    })
                    .show();

                }
              });
            });

      return parentNode
        .append(chipItButtonNode)
        .append(errorMessageNode)
        .append(confirmationButtonNode);
    });

    var container = $('<div>').attr('id', 'chipit-container');
    chipItNodes.forEach(function (node) {container.append(node); });

    if ($('div#chipit-container').size() > 0) {
      $('div#chipit-container').replaceWith(container);
    } else {
      container.insertBefore(".timeline-comment-wrapper.timeline-new-comment");
    }

  }
});
