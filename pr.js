console.log("Selecting feature review URL");
var linkElement = $('.build-statuses-list a[href*="feature_reviews"]').get(0);

if (linkElement) {
  var featureReviewURL = linkElement.href;
  console.log("Found URL " + featureReviewURL);
} else {
  console.log("No feature review link found!");
}

console.log("Reading commit messages");
var commitElements = $('.commit-message a');
var referencePattern = /^\[?([A-Z]+-\d+)\]?/;

// Extract references from commit messages
var references = commitElements.reduce(function (acc, e) {
  var matches = e.text.match(referencePattern);
  // Get the first matching group only
  var reference = (matches || [])[1]

  if (reference && acc.includes(reference) == false) {
    acc.push(matches[1]);
  }
  return acc;
}, []);

if (references.length === 0) {
  console.log("No reference found in commit messages!")
}

if (featureReviewURL && references.length > 0) {
  // Insert Chipt It links on page
  var chipitLinks = references.map(function (reference) {
    var button = document.createElement('a');
    button.text = reference + " Chip It!";
    button.className = "btn btn-outline";

    button.addEventListener("click", function(event) {
      event.preventDefault();
      chrome.runtime.sendMessage({
        action: "featureReviewDraft.start",
        reference: reference,
        featureReviewURL: featureReviewURL
      });
      return false;
    });

    $(button).insertBefore(".timeline-comment-wrapper.timeline-new-comment");
  });
}
