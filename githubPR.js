var shipItSquirrelNode = $('<img class="emoji" title=":shipit:" alt=":shipit:" src="https://assets-cdn.github.com/images/icons/emoji/shipit.png" height="20" width="20" align="absmiddle">')


var LOGGER = (function () {
  var log = function(level, msg) {
    const time = new Date().toISOString();
    console.log(`[ChipIt] ${level} ${time}: ${msg}`);
  }
  return {
    level: 7,
    error: function (msg) {
      if (this.level <= 3)
        log('ERROR', msg)
    },
    info: function (msg) {
      if (this.level <= 6)
        log('INFO', msg)
    },
    debug: function (msg) {
      if (this.level <= 7)
        log('DEBUG', msg)
    }
  }
})();

/**
 * Listen to GitHub pull request page analysis events
 */
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {

  if (message.action === "analyse_github_pull_request") {
    var findLatestFeatureReviewURL = new Promise(function(resolve, reject) {
      var retry = 5;
      var find = function (retryCount) {
        setTimeout(function () {
          var trackerLinkNodes = $('.merge-status-list .merge-status-item a[href*="feature_reviews"]');
          var featureReviewURL = trackerLinkNodes.last().attr("href");

          if (featureReviewURL) {
            LOGGER.debug("latest feature review URL is " + featureReviewURL);
            resolve({
              action: "feature_review_url_found",
              featureReviewURL: featureReviewURL
            });
          } else if (retryCount > 0) {
            LOGGER.debug("Could not find feature review URL, retrying... ");
            find(retryCount - 1);
          } else {
            LOGGER.debug("Could not find feature review URL!");
            reject({
              action: "failed_to_find_feature_review_url",
              reason: "Could not find feature review URL!"
            });
          }
        }, 500)
      };
      find(retry);
    });

    findLatestFeatureReviewURL.then(function(result){
      var commitMessagesNodes = $('td.commit-message a');
      var featureReviewURL = result.featureReviewURL;

      var ticketReferences = commitMessagesNodes.reduce(function (acc, node) {
        var TICKET_REFERENCE = /^\[?([A-Z]+-\d+)\]?/;
        var matches = node.text.match(TICKET_REFERENCE);
        // Get the first matching group only
        var reference = (matches || [])[1]

        if (reference && acc.includes(reference) == false) {
          LOGGER.debug("Found ticket reference " + reference);
          acc.push(reference);
        }
        return acc;
      }, []);

      if (ticketReferences.length === 0) {
        LOGGER.info("No ticket reference found in commit messages!")
        return false;
      }

      // Insert Chipt It button on page
      var chipItNodes = ticketReferences.map(function (reference) {
        var parentNode = $('<div>').addClass("chipit-ticket-container");
        var errorMessageNode = $('<span>').addClass("chipit-error chipit-message ").hide();
        var confirmationButtonNode = $('<a>').addClass("chipit-confirm chipit-message ").text('Confirm').hide();

        var chipItButtonNode = $('<a>')
              .text(reference + " Chip It!")
              .addClass("chipit-action-link")
              .on("click", function(event) {
                var thatNode = $(this);
                event.preventDefault();
                chrome.runtime.sendMessage({
                  action: "create_jira_comment",
                  reference: reference,
                  featureReviewURL: featureReviewURL
                }, function (response) {
                  if (response.action === "failed_to_create_jira_comment") {
                    errorMessageNode.text(response.reason).show();
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
          .append(confirmationButtonNode)[0];
      });

      var branchActionNode = $('.merge-pr > .branch-action').first();
      var discussionActionsNode = $('.discussion-timeline-actions').first();

      var containerNode = $(['<div id="chipit" class="branch-action">',
                             '<div class="branch-action-body">',
                             '<div class="merge-message">',
                             '</div>',
                             '</div>',
                             '</div>'].join(''));

      $('div#chipit').remove();
      if (branchActionNode.size() > 0) {
        containerNode.insertAfter(branchActionNode);
      } else if (discussionActionsNode.size() > 0) {
        containerNode.insertBefore(discussionActionsNode)
      }


      containerNode.find('div.merge-message').append(chipItNodes);
    });
  }
});
