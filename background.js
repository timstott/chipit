/**
 * Listens to create Jira comment events.
 * Opens new Jira tab in the background and forwards messages to sender.
 */
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  var jiraURL = "https://jira.fundingcircle.com/browse/" + message.reference;

  if (message.action === "create_jira_comment") {
    chrome.tabs.create({ url: jiraURL, active: false }, function (tab) {
      var jiraTabId = tab.id;
      console.log("Opened new tab " + jiraURL + " with id " + jiraTabId);

      // Wait until tab is accessible
      chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
        if (jiraTabId === tabId && changeInfo.status == "complete") {
          chrome.tabs.sendMessage(tabId, message, function (response) {
            if (response.action === "failed_to_create_jira_comment") {
              chrome.tabs.remove(jiraTabId);
              sendResponse(response);
            } else if (response.action === "jira_comment_created") {
              response.jiraTabId = jiraTabId;
              sendResponse(response);
            }
          });
        }
      });
    });
    // Return true to indicate response is sent async
    return true;
  }
});

/**
 * Listen to submit Jira comment events
 */
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "submit_jira_comment") {

    chrome.tabs.sendMessage(message.jiraTabId, message, function (response) {
      if (response.action === "failed_to_create_jira_comment") {
        sendResponse(response);
      } else if (response.action === "jira_comment_submitted") {
        sendResponse(response);
      }
      chrome.tabs.remove(message.jiraTabId);
    });
    // Return true to indicate response is sent async
    return true;
  }
});
/**
 * Trigger GitHub pull request page analysis
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  var GITHUB_PULL_REQUEST_URL = /^https:\/\/github\.com\/FundingCircle\/.+\/pull\/\d+\/?$/i

  if (tab.url.match(GITHUB_PULL_REQUEST_URL)) {
    chrome.tabs.sendMessage(tabId, {
      action: "analyse_github_pull_request"
    });
  }
});
