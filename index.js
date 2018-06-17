// Dependencies
var phJQuery = require("phantom-jquery")
var mkdirp = require('mkdirp')
var ProgressBar = require('progress')
var download = require('download-file')
 
var website = "https://www.japscan.cc";
var basePath = "/home/kwaadpepper/Téléchargements/Books/";

var totalPages = 0;

var books = [];
var bar = {};

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

var echo = (string) => {
    console.log ('# '+string+'\n');
};


var openUrl = (url, callBack) => {
    
    phJQuery.open(url, (err, $, page, ph) => {
 
        // Handle error
        if (err) {
            log('Error '+err)
        }
        callBack($, ph);
    });
};

var downloadFile = (url, name, path) => {
     
    var options = {
        directory: path,
        filename: name
    }
    
    download(url, options, function(err){
        log ('Error '+ err)
        if (err) throw err
    }) 
};

echo('Collecting Books');

// Init Collectiing Data
openUrl(website + "/lecture-en-ligne/l-dk/volume-11/", ($, ph) => {
 
    // collect books Title and link
    $("select#chapitres option").each((currentLink, index, next) => {
 
        currentLink.text(Titre => {
            currentLink.attr("value", href => {
                books.push({title : Titre, link : website + href});
                next();
            });
        });
    }, () => { 
        ph.exit();
 
        // bar = new ProgressBar(':bar', { total: books.length });     
        collectingPages()
    });
});

var collectingPages = () => {
    echo('Detected '+books.length+' books\n');

    // Iteration sur chaque livre
    for (const bookNumber in books) {
        if (books.hasOwnProperty(bookNumber)) {

            const book = books[bookNumber];
            book.pages = []

            // Ouverture du livre
            openUrl(book.link, ($, ph) => {
                
                // Récupération des pages
                $("select#pages option").each((currentLink, index, next) => {
            
                    currentLink.text(Titre => {
                        currentLink.attr("value", href => {
                            book.pages.push({title : Titre, link : website + href});
                            next();
                        });
                    });
                    // bar.tick();
                    // if (bar.complete) bar.interrupt();
                    // echo('Opened : '+book.title+', detected '+book.pages.length+' pages');
                }, () => {
                    echo('Begin Download')
                    ph.exit();
                    totalPages += book.pages.length;
                    downloadAll();
                });
            });
        }
    }
};

var downloadAll = () => {

    // bar = new ProgressBar(':bar', { total: totalPages });
    
    // Iterate on eah book
    for (const bookKey in books) {
        if (books.hasOwnProperty(bookKey)) {
            const book = books[bookKey];

            // Create book folder
            mkdirp(basePath + book.title, function(err) { 
            });

            // Download each Page

            for (const pageKey in book.pages) {
            if (book.pages.hasOwnProperty(pageKey)) {
                const page = book.pages[pageKey];
                
                try {
                    openUrl(page.link, ($, ph) => {

                        // collect books Title and link
                        page.imageUrl = $("image#image").attr('src');
                        downloadFile(page.imageUrl, page.imageUrl.split('/').last(), basePath + book.title + '/', () => {
                            echo ('Download '+page.imageUrl+' to '+ basePath + book.title + '/'+page.imageUrl.split('/').last())
                            // bar.tick()
                            // if (bar.complete) bar.interrupt()
                        })
                    }, () => {
                        ph.exit()
                    });

                } catch (error) {
                    log('Error '+error)
                }
            }
            }
            
        }
    }
};
