var uuid = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

/**
 * Create a new background tab in with Jira
 * Triggers feature review draft
 */
var openJiraTab = function (reference, featureReviewURL) {

  var jiraURL = "https://jira.fundingcircle.com/browse/" + reference;
  var featureReviewURL = featureReviewURL;
  var action = "featureReviewDraft.start";

  chrome.tabs.create({ url: jiraURL, active: false }, function (tab) {
    var newTabId = tab.id;
    console.log("Opened new tab " + jiraURL + " with id " + newTabId);

    // Wait until tab is accessible
    chrome.tabs.onUpdated.addListener(function (tabId, info) {
      if (newTabId === tabId && info.status == "complete") {
        chrome.tabs.sendMessage(tabId, {
          action: action,
          featureReviewURL: featureReviewURL,
          uuid: uuid()
        }, function(response) {
          console.log(response)
        });
      }
    });
  });
};


chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log('Message received: ' + JSON.stringify(message))
  if (message.action === "featureReviewDraft.start") {
    var featureReviewURL = message.featureReviewURL;
    var reference = message.reference;
    openJiraTab(reference, featureReviewURL);
  }
});
