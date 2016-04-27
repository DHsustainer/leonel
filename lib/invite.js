'use strict';
let request = require('superagent');
let async = require('async');
let debug = require('debug')('bot:invite');
let token =  process.env.SLACK_ADMIN_TOKEN || '';
let noop = () => {};

module.exports = function (bot, message, callback) {
  let email = message.match[1];
  let data = { email, token };
  let storage = bot.botkit.storage;
  callback = callback || noop;

  async.waterfall([
    function inviteToSlack(cb) {
      debug(`inviteToSlack ${email}`);

      request.post(`https://colombia-dev.slack.com/api/users.admin.invite`)
        .type('form')
        .send(data)
        .end(cb);
    },

    function getUserData(res, cb) {
      debug(`getUserData ${message.user}`, res.body);
      storage.users.get(message.user, cb);
    },

    function logInvitation(data, cb) {
      debug(`logInvitation to ${email} on user:${message.user}`, data);
      if (data === null) {
        data = { id: message.user, guests: [email] };
      } else {
        data.guests.push(email);
      }

      storage.users.save(data, cb);
    },
  ], function (err) {
    debug(`invitation by ${message.user} to ${email} complete`);
    if (err) { return console.error(err);}

    let replyMessage = 'Invitación esitosa!';
    bot.reply(message, replyMessage);

    // unfortunately the botkit `hears` cb doesn't expect async
    // behavior, so testing for it is difficult. to fix this
    // we add a third optional param as a callback so we can
    // predict flow and test better, we end it below
    callback();
  });

};