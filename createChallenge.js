let fs = require("fs");
require("chromedriver");
let swd = require("selenium-webdriver");
// browser
let bldr = new swd.Builder();

// tab
let driver = bldr.forBrowser("chrome").build();

let cFile = process.argv[2];
let qFile = process.argv[3];




(async function () {

    try {
        // implicit and pageload wait for driver.findElements
        await driver.manage().setTimeouts({
            implicit: 10000,
            pageLoad: 10000
        });

        await loginCredentials();

        let anchorTagDropDownElement = await driver.findElement(swd.By.css("a[data-analytics=NavBarProfileDropDown]"));
        await anchorTagDropDownElement.click();

        let anchorTagElement = await driver.findElement(swd.By.css("a[data-analytics=NavBarProfileDropDownAdministration]"));
        await anchorTagElement.click();

        await waitForLoader();

        let questions = await readQuestions();

        for (let i = 0; i < questions.length; i++) {
            await createChallenge(questions[i]);
        }

    }
    catch (err) {
        console.log(err);
    }

})();

let waitForLoader = async function () {
    let waitForLoaderPromise = driver.wait(swd.until.elementLocated(swd.By.css("#ajax-msg")), 10000);
    return waitForLoaderPromise;
}

let editorHandler = async function (s, element, data) {
    let pElement = await driver.findElement(swd.By.css(s));
    await driver.executeScript("arguments[0].setAttribute('style','height:20px')", pElement);
    await element.sendKeys(data);
}

let loginCredentials = async function () {

    let fileReadPromise = fs.promises.readFile(cFile);
    let data = await fileReadPromise;
    let credentials = JSON.parse(data);
    let user = credentials.userName;
    let pass = credentials.password;
    let url = credentials.url;

    await driver.get(url);

    let userNameFieldPromise = driver.findElement(swd.By.css("#input-1"));
    let passwordFieldPromise = driver.findElement(swd.By.css("#input-2"));

    let userNPassElements = await Promise.all([userNameFieldPromise, passwordFieldPromise]);

    let userFieldEnterPromise = userNPassElements[0].sendKeys(user);
    let passwordFieldEnterPromise = userNPassElements[1].sendKeys(pass);

    await Promise.all([userFieldEnterPromise, passwordFieldEnterPromise]);

    let submitFieldPromise = driver.findElement(swd.By.css("button[type=submit]"));
    let submitElement = await submitFieldPromise;

    await submitElement.click();
}

let createChallenge = async function (question) {

    let manageChallengesTabAnchorElements = await driver.findElements(swd.By.css("ul.admin-tabbed-nav li a"))
    await manageChallengesTabAnchorElements[1].click();

    let createChallengeBtnElement = await driver.findElement(swd.By.css("button.btn.btn-green.backbone.pull-right"));
    await createChallengeBtnElement.click();

    let eselector = ["#name", "textarea.description",
        "#problem_statement-container .CodeMirror div textarea",
        "#input_format-container .CodeMirror div textarea",
        "#constraints-container .CodeMirror div textarea",
        "#output_format-container .CodeMirror div textarea",
        "#tags_tagsinput div input",
        "button.save-challenge.btn.btn-green"];

    let name = question["Challenge Name"];
    let desc = question["Description"];
    let problem = question["Problem Statement"];
    let inputF = question["Input Format"];
    let constraints = question["Constraints"];
    let outputF = question["Output Format"];
    let tags = question["Tags"];
    let testCases = question["Testcases"];

    let eselectorPromises = eselector.map(function (s) {
        let eselectorPromise = driver.findElement(swd.By.css(s));
        return eselectorPromise;
    })

    let AllElements = await Promise.all(eselectorPromises);

    let nameEnteredPromise = AllElements[0].sendKeys(name);
    let descEnteredPromise = AllElements[1].sendKeys(desc);

    await Promise.all([nameEnteredPromise, descEnteredPromise]);

    await editorHandler("#problem_statement-container .CodeMirror div", AllElements[2], problem);
    await editorHandler("#input_format-container .CodeMirror div", AllElements[3], inputF);
    await editorHandler("#constraints-container .CodeMirror div", AllElements[4], constraints);
    await editorHandler("#output_format-container .CodeMirror div", AllElements[5], outputF);

    await AllElements[6].sendKeys(tags);
    await AllElements[6].sendKeys(swd.Key.ENTER);

    await AllElements[7].click();
    await driver.wait(swd.until.elementLocated(swd.By.css("button.preview-challenge.btn.msR")),10000);
    await waitForLoader();

    await driver.get("https://www.hackerrank.com/administration/challenges");
}

let readQuestions = async function () {
    let questions = require("./"+qFile);
    return questions;
}