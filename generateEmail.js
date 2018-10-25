var fs = require('fs');
const _ = require('lodash');

// var path = require('path');
var { toJS } = require('mobx');

const msg = `This message has been automaticaly generated because you have made 
changes to your walk bookings or made a payment. <br/>
<ul><li>
If you don't want to receive these messages in future or wish us to use a 
different email address then please let the membership secretary know
(<a href="mailto:membership@stedwardsfellwalkers.co.uk">membership@stedwardsfellwalkers.co.uk</a>).
</li><li>
If you think that any of the data shown is incorrect then please contact the 
booking secretaries (<a href="mailto:bookings@stedwardsfellwalkers.co.uk">bookings@stedwardsfellwalkers.co.uk</a>).
</li><li>
Please don't reply to this message.
</li></ul> `;

const testersMsg = `Only committee members are receieving confirmation emails while we test the system.<br/>
The content of this message, with the exception of this 
information box is what would be sent to members if this system were introduced.<br/>
In testing I neeed to establish a number of things.
<ol>
<li>If there a problems viewing this message then 
please let me know.</li>
<li>Finally, could the content of the message could be improved.</li>
</ol>
Thanks for patiences<br>
Aidan Nichol<br/>
<a href="mailto:aidan@nicholware.co.uk">aidan@nicholware.co.uk</a>`;

const html = body =>
  `
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
          <title>St.Edwards Booking Receipt</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        ${body}
      </html>`;

const headerStyle = `display:inline-block;font-size:1.2em;border: thin solid black; 
background-color:#0083ff; border-radius:5px;padding:5px;`;

// const bookingsText = `This table shows the current state
//          of your bookings for future walks and the availabilty of seats for each
//          walk.`;
const logsText = `This table shows all activity involving current walks since
the last time the account was in balance.`;

const myBody = (name, logsTable, balSt, walksTable) =>
  `<body style="margin: 0; padding: 0;">
        <table border=0 cellPadding=0 cellSpacing=0 width="98%">
        <thead>
        <tr valign="middle">
        <td style="background-color:#fecccc;">
        <span style="font-weight: bold; font-size:20px; color: #be0c0c; ">
        <img
        src="http://www.stedwardsfellwalkers.co.uk/bkngs/steds-logo.png"
        alt="O"
        width="40"
        height="40"
        style="vertical-align: middle; padding: 10px;"
        />
        St.Edwards Fellwalkers
        </span>
        </td>
        </tr>
        </thead>
        <tbody style="padding-left: 10px;">
        <tr> <td style="padding: 20px;font-size: 1.3em;">${name}</td></tr>
        <tr> <td style="padding: 20px; border: thin solid black; background-color:#cccccc; border-radius:8px;" >${testersMsg}</td> </tr>
        <tr> <td style="padding: 20px;" >${msg}</td> </tr>
        <tr> <td width=30 style="padding-left: 20px;" > <span style="${headerStyle}">Recent Activity Log</span> </td> </tr>
        <tr> <td style="padding: 20px; " > ${logsText}</td> </tr>
        <tr> <td style="padding-left: 20px;" >${logsTable}</td> </tr>
        <tr> <td style="padding-left: 20px;" ><span style="display:block; font-size:1.2em; padding: 20px;">${balSt}</span></td> </tr>
        <tr> <td width=30 style="padding-left: 20px;" > <span style="${headerStyle}">Future Bookings and Seat Avilability</span> </td> </tr>
        <tr> <td style="padding: 20px;" >${walksTable}</td> </tr>
        </tbody>
        </table>
    </body>`;
/*
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃                                                          ┃
  ┃                display acctivity Log                     ┃
  ┃                                                          ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  */
let old = false;
let outstanding = false;
const showBalance = log => {
  if (!/^[BC]/.test(log.req) && log.type !== 'A') return '&nbsp;';
  return `<span style="${log.balance < 0 ? 'color: red;' : ''}">${log.balance}</span>
  <span style="display:inline-block; width:20px; padding-left:1px;">${
    log.balance > 0 ? 'CR' : '&nbsp;'
  }</span>`;
};

const balanceStatus = bal => {
  if (bal === 0)
    return `All walks booked have been paid for and you have no credits available.`;
  if (bal < 0)
    return `You currently owe <span style="font-weight: bold;">&pound;${-bal}</span> for booked walks`;
  return `You currently have a credit of <span style="font-weight: bold;">&pound;${bal}</span> which will be used to pay for future bookings.`;
};

const dispLog = log => {
  old = old || (log.old || false);
  outstanding = outstanding || (log.outstanding || false);
  const style =
    (log.outstanding ? 'font-weight:bold;' : '') +
    (log.old ? 'opacity:0.5;' : '') +
    'padding-left:6;padding-right:6;';
  return (
    `  <tr style="${style} ">
    <td align="right" style="padding-left:6;padding-right:6">${log.dispDate}</td>
    <td><img src="http://www.stedwardsfellwalkers.co.uk/bkngs/icon-${log.req}.jpg" alt="${
      log.req
    }"/></td>
    <td>` +
    (log.type !== 'A' && log.name
      ? ` <span style="font-style: italic; font-size: 0.9em;"> ${log.name} </span>`
      : ``) +
    `<span style="${style}" >
        ${log.text}
      </span>
    </td>
    <td align="center" >${log.amount > 0 ? log.amount : '&nbsp;'}</td>
    <td align="center" >${log.amount < 0 ? -log.amount : '&nbsp;'}</td>
    <td align="right"> ${showBalance(log)} </td>` +
    (log.new
      ? `<td><span style="background-color: yellow; font-weight:bold">&nbsp;new&nbsp;</span></td>`
      : '') +
    ` </tr>`
  );
};

const logsTable = logs => {
  old = false;
  outstanding = false;
  let txt = logs
    .filter(log => !log.hideable && log.req !== '_')
    .reduce((txt, log) => txt + dispLog(log), '');
  const oldText = old ? `Bookings shown greyed out refer to past walks.` : ``;
  const outstandingText = outstanding
    ? `Payment is required for bookings shown in bold.`
    : ``;
  let footer = `<span  style="font-style: italic; font-size: 0.95em;">${oldText}<br/>${outstandingText}</span>`;
  return `
<table border=0 cellspacing=0 cellpadding=0>
<tr style="background-color: cyan; padding-left:6;padding-right:6;">
<th><span class="logDate">Date</span></th>
        <th>&nbsp;</th>
        <th><span class="logText">Event</span></th>
        <th><span class="logAmount">&nbsp;Exp.&nbsp;</span></th>
        <th><span class="logAmount">&nbsp;Inc.&nbsp;</span></th>
        <th><span>Balance</span></th>
        <th bgcolor="white">&nbsp;</th>
</tr>
${txt}
</table>
${footer}`;
};
/*
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃                                                          ┃
  ┃                Booking Status Table                      ┃
  ┃                                                          ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  */
let footnote = '';
const displayBooking = (walk, memId) => {
  let booking = walk.bookings.get(memId);
  let wNo = 0;
  if (booking && booking.status === 'W') {
    footnote = `<span style="font-style: italic; font-size: 0.95em;">
        The number following the <img src="http://www.stedwardsfellwalkers.co.uk/bkngs/icon-W.jpg" alt="W" /> is your 
        current position on the waiting list.</span>`;
    let lastactive = _.last(booking.logsValues).dat;
    let wList = waitingList(walk);
    wNo = wList.findIndex(w => w === lastactive) + 1;
  }
  const bkng =
    booking && booking.status.length < 2
      ? `<img src="http://www.stedwardsfellwalkers.co.uk/bkngs/icon-${
          booking.status
        }.jpg" alt="${booking.status}" />${wNo ? wNo : ''}`
      : '&nbsp;';
  return `<td align=center style="min-width: 60px;">${bkng}</td>`;
};
const waitingList = walk => {
  return walk.bookingsValues
    .filter(b => b.status === 'W')
    .map(b => _.last(b.logsValues).dat)
    .sort();
};
const displayWalk = (walk, members) =>
  `<tr >
    <td align=center style="padding:6px;"> ${walk.walkDate} <br /> ${walk.venue} </td>
    <td align=center >${walk.bookingTotals.display}</td>` +
  members.reduce((acc, member) => acc + displayBooking(walk, member.memId), '') +
  '</tr>';

const displayWalks = (openWalks, members) =>
  openWalks.reduce((acc, walk) => acc + displayWalk(walk, members), '');

const bookingsTable = (walks, members) => {
  footnote = '';
  return (
    `
    <table border=1 cellspacing=0  cellpadding=6>
        <thead style="background-color:cyan;" >
        <tr>
        <th >
        Date<br />Venue
        </th>
        <th >Available<br/>(wait list)</th>` +
    members.reduce(
      (acc, member) =>
        acc + `<th> ${members.length > 1 ? member.firstName : '&nbsp;'} </th>`,
      '',
    ) +
    `
            </tr>
          </thead>
          <tbody>${displayWalks(walks, members)}</tbody>
        </table>${footnote}
    `
  );
};
/*
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃                                                          ┃
  ┃                display account status                    ┃
  ┃                                                          ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  */
function generateEmail(acc, lastRun, walks, today) {
  const data = acc.accountStatusNew;
  const { accName, balance } = data;
  let logs = data.logs.filter(log => !log.hideable && log.req !== '_').map(log => ({
    ...log,
    ...{
      new: log.dat > lastRun,
      old: log.walkId && log.walkId < today,
    },
  }));
  const logsHtml = logsTable(logs);
  const bkngsHtml = bookingsTable(walks, toJS(acc.accountMembers));
  const txt = html(myBody(accName, logsHtml, balanceStatus(balance), bkngsHtml));

  // let { mailgunConf } = require(path.resolve(process.cwd(), './config.js'));
  fs.writeFileSync('email.html', txt);
  return txt;
}
// var coll = new Intl.Collator();
// var alphaCmp = (a, b) => coll.compare(a, b);

module.exports = generateEmail;
