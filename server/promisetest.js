/_ ES5 _/
var isMomHappy = true;

// Promise
var willIGetNewPhone = new Promise(
    function (resolve, reject) {
        resolve("YES")
        // reject("NO")
    }
);

var askMom = function () {
    willIGetNewPhone
        .then(function(fulfilled){
            console.log(fulfilled)
            return "the output of the first step"
        })
        .then(function(msg1){
            console.log(msg1)
        })
        .catch(function(error){
            console.log(error)
        })
}

askMom()