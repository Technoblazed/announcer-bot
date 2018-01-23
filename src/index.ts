import * as jsonfile from 'jsonfile';
import * as path from 'path';
import * as appRootPathLib from 'app-root-path';
import * as Eris from 'eris';
import { URL } from 'url';
import * as _ from 'lodash';
import * as debug from 'debug';

const log = debug('discord');

const appRootPath = appRootPathLib.toString();
const configPath = path.join(appRootPath, 'config', 'discord.json');
const config = jsonfile.readFileSync(configPath);

const bot = new Eris(config.token);

const timeout = {};

function isTwitchUrl(url) {
  const parsedURL = new URL(url);
  return (parsedURL.host === 'www.twitch.tv');
}

bot.on('ready', () => {
  console.log('Ready!');
});

bot.on('presenceUpdate', (member, priorPresence) => {
  if (process.env.debug === 'discord') {
    log(`game: ${(_.has(member, 'game')) ? JSON.stringify(member.game) : 'none'}`);
    log(`status: ${member.status || 'none'}`);
  }

  if (_.has(timeout, member.id)) {
    return log('timeout of 60 min to prevent spam.');
  }

  const memberHasUrl = _.has(priorPresence, ['game', 'url']);
  if ((memberHasUrl) && (isTwitchUrl(priorPresence.game.url))) {
    return log('already has a twitch url');
  }

  if (_.has(member, ['game', 'url']) === false) {
    return log('does not have a game url');
  }

  if (isTwitchUrl(member.game.url)) {
    bot.createMessage(config.channel, `<@${member.id}> has gone live.`);
    timeout[member.id] = setTimeout(
      () => {
        clearTimeout(timeout[member.id]);
        delete timeout[member.id];
      },
      60 * 60 * 1000,
    );
  }
});

bot.connect();
