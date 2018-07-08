// let web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
if(web3.eth.accounts.length == 0){
    alert("Metamask Not Logged In");
}
let self = web3.eth.accounts[0];
let abi = [{"constant":false,"inputs":[{"name":"_uid","type":"uint256"}],"name":"voteAgainst","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getNumberOfQuestions","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_uid","type":"uint256"}],"name":"deleteQuestion","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_uid","type":"uint256"}],"name":"getQuestionDetails","outputs":[{"name":"","type":"string"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_question","type":"string"}],"name":"addQuestion","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_uid","type":"uint256"}],"name":"voteInFavour","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":true,"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"id","type":"uint256"},{"indexed":false,"name":"infavour","type":"uint256"},{"indexed":false,"name":"against","type":"uint256"},{"indexed":false,"name":"question","type":"string"}],"name":"newQuestionAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"id","type":"uint256"},{"indexed":false,"name":"infavour","type":"uint256"},{"indexed":false,"name":"against","type":"uint256"}],"name":"updatedQuestion","type":"event"}];
let VotingContract = web3.eth.contract(abi);
let contractInstance = VotingContract.at('0x433234739bcff02a401a1dbabb5c88b4e87ca6dc');
let total = 0;

function getNum(){
    contractInstance.getNumberOfQuestions({from: self}, function (err, result) {
        console.log(result.valueOf());
    });
}

$(document).ready(function () {
    contractInstance.getNumberOfQuestions({from: self}, function (err, result) {
        if(err) throw err;
        let number = result.valueOf();
        total = number;
        for(let i = 0; i < number; i++){
            getQuestionDetails(i, function (question, infavour, against, isActive, canVote) {
                if(isActive == 1){
                    if(canVote){
                        $('.questions').append('<section class="votebox" id="' + i + '">\n' +
                            '        <p class="pollid">Poll ID: ' + i + ' </p>\n' +
                            '        <p class="question">' + question +
                            '        </p>\n' +
                            '        <button class="pollbutton yes" onclick="onClickYes('+i+')">Yes</button>\n' +
                            '        <button class="pollbutton no" onclick="onClickNo('+i+')">No</button>\n' +
                            '        <button class="pollbutton voted" style="display: none">Transaction is Mining (Click Here To See The Progress)</button>' +
                            '        <p class="infavour">Votes For Yes : ' + infavour + '</p>\n' +
                            '        <p class="against">Votes For No : ' + against + '</p>' +
                            '    </section>');
                    }else{
                        let link = localStorage.getItem(JSON.stringify(i));
                        $('.questions').append('<section class="votebox" id="' + i + '">\n' +
                            '        <p class="pollid">Poll ID: ' + i + ' </p>\n' +
                            '        <p class="question">' + question +
                            '        </p>\n' +
                            "        <button class='pollbutton voted'>Already Voted (Click Here to See the Block)</button>\n" +
                            '        <p class="infavour">Votes For Yes : ' + infavour + '</p>\n' +
                            '        <p class="against">Votes For No : ' + against + '</p>' +
                            '    </section>');

                        let str = "#" + i;
                        $(str).children('.voted').attr('onclick', "openEtherScan('"+link+"')");
                    }
                }
            });
        }
    });

    function getQuestionDetails(uid, callback) {
        contractInstance.getQuestionDetails(uid, {from: self}, function (err, result) {
            if(err) throw err;
            let arr = result.valueOf();
            callback(arr[0], arr[1].valueOf(), arr[2].valueOf(), arr[3].valueOf(), arr[4].valueOf());
        });
    }


    let upDated = contractInstance.updatedQuestion();
    upDated.watch(function (err, result) {
        if(err) throw err;
        let uid = result.args.valueOf().id.valueOf();
        let infavour = result.args.valueOf().infavour.valueOf();
        let against = result.args.valueOf().against.valueOf();
        makeUpdate(uid, infavour, against);
    });

    let newQuestion = contractInstance.newQuestionAdded();
    newQuestion.watch(function (err, result) {
        if(err) throw err;
        let uid = result.args.valueOf().id.valueOf();
        let infavour = result.args.valueOf().infavour.valueOf();
        let against = result.args.valueOf().against.valueOf();
        let question = result.args.valueOf().question;
        addNewQuestion(uid, infavour, against, question);
    });

    function addNewQuestion(uid, infavour, against, question) {
        if(uid >= total){
            if(document.getElementById('#' + uid) === null){
                $('.questions').append('<section class="votebox" id="' + uid + '">\n' +
                    '        <p class="pollid">Poll ID: ' + uid + ' </p>\n' +
                    '        <p class="question">' + question +
                    '        </p>\n' +
                    '        <button class="pollbutton yes" onclick="onClickYes('+uid+')">Yes</button>\n' +
                    '        <button class="pollbutton no" onclick="onClickNo('+uid+')">No</button>\n' +
                    '        <button href="" class="pollbutton voted" style="display: none">Transaction is Mining (Click Here To See The Progress)</button>' +
                    '        <p class="infavour">Votes For Yes : ' + infavour + '</p>\n' +
                    '        <p class="against">Votes For No : ' + against + '</p>' +
                    '    </section>')
            }
        }
    }

    function makeUpdate(uid, infavour, against) {
        let str = "#" + uid;
        let $infavour = $(str).children('.infavour').html('Votes For Yes : ' + infavour + '');
        let $against = $(str).children('.against').html('Votes For No : ' + against + '');
    }


});

function voteInFavour(uid) {
    contractInstance.voteInFavour(uid, {from: self, gas: 70000, gasPrice: web3.toWei(40,'gwei')}, function (err, hash) {
        if(err){
            throw err;
        }else{
            let etherscan_link = "https://ropsten.etherscan.io/tx/" + hash;
            console.log(hash);
            localStorage.setItem(uid, etherscan_link);
            let str = "#" + uid;
            $(str).children('.yes').css('display', 'none');
            $(str).children('.no').css('display', 'none');
            $(str).children('.voted').css('display', 'inline-block');
            $(str).children('.voted').attr('onclick', "openEtherScan('"+etherscan_link+"')");
        }
    });
}

function voteAgainst(uid) {
    contractInstance.voteAgainst(uid, {from: self, gas: 70000, gasPrice: web3.toWei(40,'gwei')}, function (err, hash) {
        if(err){
            throw err;
        }else{
            let etherscan_link = "https://ropsten.etherscan.io/tx/" + hash;
            console.log(hash);
            let str = "#" + uid;
            localStorage.setItem(uid, etherscan_link);
            $(str).children('.yes').css('display', 'none');
            $(str).children('.no').css('display', 'none');
            $(str).children('.voted').css('display', 'inline-block');
            $(str).children('.voted').attr('onclick', "openEtherScan('"+etherscan_link+"')");
        }
    });
}

function openEtherScan(link){
    window.open(link);
}

function onClickYes(i) {
    voteInFavour(i);
}

function onClickNo(i) {
    voteAgainst(i);
}

function addQuestion(val) {
    contractInstance.addQuestion(val, {from: self , gas: 200000, gasPrice: web3.toWei(40,'gwei')}, function (err, result) {
    });
}

function deleteQuestion(val) {
    contractInstance.deleteQuestion(val, {from: self, gas: 70000, gasPrice: web3.toWei(40,'gwei')}, function (err, result) {
    });
}
