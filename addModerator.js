let fs = require("fs");
require("chromedriver");
let swd = require("selenium-webdriver");
// browser
let bldr = new swd.Builder();

// tab
let driver = bldr.forBrowser("chrome").build();

let cFile = process.argv[2];
let modName = process.argv[3];
let questionEl;




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

        let manageContestElements = await driver.findElements(swd.By.css(".admin-tabbed-nav li a"));
        let mpUrl = await manageContestElements[1].getAttribute("href");
        await manageContestElements[1].click();

        await waitForLoader();

        let qidx = 4;

        while(true){
            questionEl = await getQuestionElement(qidx,mpUrl);
            if(questionEl == null){
                console.log("All Moderators are  Added.");
                return;
            }
            await handleQuestionElement();
            qidx++;
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

let getQuestionElement = async function(qidx,mpUrl){

    let pidx = Math.floor(qidx/10);
    let pQidx = qidx%10;

    console.log(pidx+":"+pQidx);
    await driver.get(mpUrl);

    await driver.wait(swd.until.elementLocated(swd.By.css(".pagination ul li")));

    let paginations = await driver.findElements(swd.By.css(".pagination ul li"));
    let nxtBtn = paginations[paginations.length-2];
    let className = await nxtBtn.getAttribute("class");


    for(let i=0;i<pidx;i++){
        if(className == "disabled"){
            return null;
        }
        await nxtBtn.click();
        await waitForLoader();

        await driver.wait(swd.until.elementLocated(swd.By.css(".pagination ul li")));

        paginations = await driver.findElements(swd.By.css(".pagination ul li"));
        nxtBtn = paginations[paginations.length-2];
        className = await nxtBtn.getAttribute("class");        
    }

    let qElements = await driver.findElements(swd.By.css(".backbone.block-center"));

    if(pQidx<qElements.length){
        let qElement = qElements[pQidx];
        return qElement;
    }
    else{
        return null;
    }

}

let handleQuestionElement = async function(){
    await questionEl.click();
    await waitForLoader();
    await driver.wait(swd.until.elementLocated(swd.By.css("#tags_addTag")),5000);
    let moderatorTab = await driver.findElement(swd.By.css("li[data-tab=moderators]"));
    await moderatorTab.click();
    let moderatorInputElement = await driver.findElement(swd.By.css("input[id=moderator]"));
    await moderatorInputElement.click();
    await moderatorInputElement.sendKeys(modName);
    await moderatorInputElement.sendKeys(swd.Key.ENTER);
    await driver.executeScript('window.scrollTo(0,10000);');
    let saveBtnElement = await driver.findElement(swd.By.css("button.save-challenge"));
    await saveBtnElement.click();
    await driver.wait(swd.until.elementIsEnabled(saveBtnElement),1000);
} 