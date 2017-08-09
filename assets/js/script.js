// toggle all check box to sign up all attendees
function toggle (source) {
  checkboxes = document.getElementsByName('allpk')
  for (var i = 0, n = checkboxes.length; i < n; i++) {
    checkboxes[i].checked = source.checked
  }
}
