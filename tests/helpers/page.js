const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class CustomPage {
  // This static function generates a new puppeteer page and a new instance of CustomPage
  // and combines the two with a new proxy object and return that
  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'] // prevents tinkering with some of the setting on CI server (Travis) and improve performance
    });

    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    return new Proxy(customPage, {
      get: function (target, property) {
        return customPage[property] || browser[property] || page[property];
      }
    });
  }

  constructor(page) {
    this.page = page;
  }

  async login() {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    await this.page.setCookie({ name: 'session', value: session });
    await this.page.setCookie({ name: 'session.sig', value: sig });
    // --- Refresh page to set new headers
    // await this.page.goto('localhost:3000/blogs');
    // To await that the logout button is rendered before proceeding
    // await this.page.waitFor('a[href="/auth/logout"]');
    // or
    await this.page.goto('http://localhost:3000/blogs', {
      waitUntil: 'domcontentloaded'
    });
  }

  // Create a more pleasing funtion (abstract) to take a CSS selector and return the innerHTML using puppeteers $eval()
  async getContentsOf(selector) {
    return this.page.$eval(selector, (el) => el.innerHTML);
  }

  get(path) {
    return this.page.evaluate((_path) => {
      return fetch(_path, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }
      }).then((res) => res.json());
    }, path);
  }

  post(path, data) {
    return this.page.evaluate(
      (_path, _data) => {
        return fetch(_path, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(_data)
        }).then((res) => res.json());
      },
      path,
      data
    );
  }

  execRequests(actions) {
    return Promise.all(
      actions.map(({ method, path, data }) => {
        return this[method](path, data);
      })
    );
  }
}

module.exports = CustomPage;
