// =================== Form Trigger ===================
function onFormSubmit(e) {
  var response = e.response;

  var ss = SpreadsheetApp.openById('1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU'); // Replace with your sheet ID
  var sheet = ss.getSheetByName('User Profiles');
  var row = sheet.getLastRow();

  handleSubmission(response, sheet, row);
}

// =================== Sheet Trigger ===================
function onEdit(e) {
  var sheet = e.range.getSheet();
  if (sheet.getName() !== 'User Profiles') return;

  var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  var passwordCol = headers.indexOf('Password') + 1;
  var usernameCol = headers.indexOf('Username') + 1;

  // Only trigger if Password or Username edited
  if (e.range.getColumn() !== passwordCol && e.range.getColumn() !== usernameCol) return;

  var row = e.range.getRow();
  var data = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Build fake response object
  var fakeResponse = {
    getItemResponses: function() {
      return headers.map(function(h,i){
        return {
          getItem: () => ({ getTitle: () => h }),
          getResponse: () => data[i]
        };
      });
    },
    getEditResponseUrl: function() { return ''; },
    getRespondentEmail: function() { return data[headers.indexOf('Email Address')] || ''; }
  };

  handleSubmission(fakeResponse, sheet, row);
}

// =================== Shared Handler ===================
function handleSubmission(response, sheet, row) {
  try {
    var emailTitle = 'Email Address';
    var pwdTitle = 'Password';
    var usernameTitle = 'Username';

    var answers = {};
    response.getItemResponses().forEach(function(ir){
      answers[ir.getItem().getTitle()] = ir.getResponse();
    });

    var email = answers[emailTitle] || response.getRespondentEmail();
    var pwd = answers[pwdTitle] || '';
    var username = answers[usernameTitle] || '';

    if (!email) return;

    // Password rules
    var rules = [
      {desc: 'Minimum 8 characters', test: pwd.length >= 8, points: 25},
      {desc: 'At least one uppercase letter', test: /[A-Z]/.test(pwd), points: 25},
      {desc: 'At least one number', test: /\d/.test(pwd), points: 25},
      {desc: 'At least one special character', test: /[!@#$%^&*(),.?":{}|<>]/.test(pwd), points: 25}
    ];

    var passedPoints = rules.filter(r => r.test).reduce((sum,r)=>sum+r.points,0);
    var percentage = passedPoints;
    var strengthLabel = '';
    if (percentage === 100) strengthLabel = 'Very Strong';
    else if (percentage >= 75) strengthLabel = 'Strong';
    else if (percentage >= 50) strengthLabel = 'Medium';
    else strengthLabel = 'Weak';

    // Detailed rule assessment for email
    var ruleAssessment = '';
    rules.forEach(function(r){
      ruleAssessment += r.desc + ': ' + (r.test ? 'Passed ✅' : 'Failed ❌') + '\n';
    });

    // Highlight password strength in sheet
    var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
    var passwordCol = headers.indexOf('Password') + 1;
    highlightPasswordStrength(sheet, row, passwordCol, percentage);

    // Build email body
    var body = 'Hello ' + (answers['Full name'] || '') + '!\n\n';
    body += 'Thank you for submitting your account information. Here’s a summary of your key details:\n\n';
    body += 'Username: ' + username + '\n';
    body += 'Email: ' + email + '\n';
    body += 'Password Submitted: ' + pwd + '\n\n';
    body += 'Password Assessment:\n';
    body += ruleAssessment + '\n';
    body += 'Password Strength Score: ' + percentage + '% (' + strengthLabel + ')\n\n';

    if (percentage < 100) {
      body += 'Action Needed:\n';
      if (response.getEditResponseUrl) body += 'Please update your password using this link: ' + response.getEditResponseUrl() + '\n\n';
      else body += 'Please update your password to meet all strength requirements.\n\n';
    } else {
      body += 'Your account has been successfully created with a strong password.\n\n';
    }

    body += 'If you have any concerns, you may reach:\n\n';
    body += 'Ezequiel John B. Crisostomo\n';
    body += 'Membership and Internal Affairs Officer\n';
    body += 'Facebook/Messenger: Ezequiel Crisostomo\n\n';
    body += 'Thank you!\nYouth Service Philippines Tagum Chapter';

    // Send email
    MailApp.sendEmail({to: email, subject: 'Your Account Submission', body: body});

    // Log weak passwords
    if (percentage < 100) {
      var logSheet = sheet.getParent().getSheetByName('WeakPasswords') || sheet.getParent().insertSheet('WeakPasswords');
      logSheet.appendRow([new Date(), email, username, pwd, percentage, strengthLabel]);
    }

  } catch(err) {
    Logger.log('Error in handleSubmission: ' + err);
  }
}

// =================== Password Strength Highlight ===================
function highlightPasswordStrength(sheet, row, passwordCol, percentage) {
  var color = '';
  if (percentage < 50) color = '#ff4d4d';          // Weak - Red
  else if (percentage < 75) color = '#ffb84d';     // Medium - Orange
  else if (percentage < 100) color = '#b3ff66';    // Strong - Light Green
  else color = '#33cc33';                          // Very Strong - Green

  sheet.getRange(row, passwordCol).setBackground(color);
}
