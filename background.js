/**
 * Create a new background tab in with Jira
 * Triggers feature review draft
 */
var openJiraTab = function(reference, featureReviewURL) {

  var jiraURL = "https://jira.fundingcircle.com/browse/" + reference;
  var featureReviewURL = featureReviewURL;
  var action = "featureReviewDraft.start";

  chrome.tabs.create({ url: jiraURL, active: false }, function (tab) {
    var tabId = tab.id;
    console.log("Opened new tab " + jiraURL + " with id " + tabId);
    // Wait until tab is accessible
    chrome.tabs.onUpdated.addListener(function (tabId, info) {
      if (info.status == "complete") {
        chrome.tabs.sendMessage(tabId, {
          action: action,
          featureReviewURL: featureReviewURL
        }, function(response) {
          console.log(response)
        });
      }
    });
  });
};


chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "featureReviewDraft.start") {
    var featureReviewURL = message.featureReviewURL;
    var reference = message.reference;
    openJiraTab(reference, featureReviewURL);
  }
});
