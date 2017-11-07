import tress  from 'tress';
import cheerio from 'cheerio';

import chrono from 'chrono-node';
import moment from 'moment';
import axios from 'axios';

import { saveEventItemToDB, convertMonths, formatDate, checkText } from './helpers';


const URL = 'https://events.dev.by';

const results = []
let pagesCount;


const q = tress((url, callback) => {

  axios.get(url)
    .then(data => {
      const $ = cheerio.load(data.data);

      // q.push('https://events.dev.by?page=4');
      // if main page
      // if (url.split('.by')[1][0] !== '/') {
      if (url === 'https://events.dev.by') {
        // console.log('main url', url);
        pagesCount = $('.body-events .item').length;
        $('.body-events .item').each((item, i) => {
          const link = $(i).find('a.title').attr('href');
          q.push(`${URL}${link}`);
        });
        callback();
        return;
      }

      // if event's page
      console.log('parsing', url);

      const page = '.show-events';

      const title = $(page).find('h1').text();
      const html = $(page).find('.bl').html();
      const originalLink = url.split(`${URL}`)[1];

      const dateBlock = $(page).find('.time').text();

      const parsedDate = chrono.parse(convertMonths(dateBlock))[0].start.knownValues;
      console.log(parsedDate);
      console.log(new Date());
      const { day, month, hour, minute } = parsedDate;
      let year = moment().format('YYYY');
      const date = formatDate(year, month, day, hour, minute);
      // console.log(new Date(date));

      // if ($(page).find('.adress-events-map'))

      results.push({
        date: date,
        title: title,
        text: html,
        originalLink,
        source: 'events.dev.by',
        status: checkText(html) ? 'active' : 'active',
      });

      callback();
    })
    .catch(error => {
      console.log(error);
    })
}, 5);

q.drain = () => {
  console.log('pages count', pagesCount);
  console.log('results length', results.length);
  if (pagesCount === results.length) {
    saveEventItemToDB(results);
    // console.log(results);
  } else {
    console.log('some error happened');
  }
}

const init = () => {
  q.push(URL);
}

export default { init };
