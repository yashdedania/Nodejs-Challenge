
const https = require('https');
const fs = require('fs');
const path = require('path');
const pathtostore = path.normalize(__dirname+'/data.json');

let final_data = {};
let html_links = null;
let URLS = [];
let limit = 5;
let connections = 0;
https.get('https://medium.com/sitemap/sitemap.xml',function(res){
    var response_data = "";
    res.setEncoding('utf8');
    res.on('data',function(chunk){
        response_data += chunk;
    });
    res.on('end',function(){
        URLS = parseXml(response_data); // urls fetched from sitemap are stored in this variable
        fetchData();
    }).on('error',function(e){
		console.log(e);
	});
});

//this function fetches  each single url from sitemap.xml
 function fetchData(){

    if(URLS.length == 0 ){
       storedata();
	   return;
    }
    let url = URLS.shift()
    console.log("-----------------");
    console.log(url);
    https.get(url,function(res){
        var response_data = "";
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            response_data += chunk;
        });
        res.on('end', function() {
        html_links = parseXml(response_data); // each individual url from sitemap.xml has html links which are fetched and stored in this variable.
		
		console.log("-------------html link length: "+html_links.length);
        fetchHtml();
        
        });
    }).on('error',function(e){
        console.log("Error in fetching XML url: "+e.message);
        fetchData(URLS.shift());
    });
}
//fetches all html urls and stores internal urls of individual pages.
function fetchHtml(){
    let url = html_links.shift();
    connections++;
    var request = https.get(url,function(res){
            let new_data = "";
        
            res.on('data', function(chunk) {
                new_data += chunk;
                
            });
            while(connections < limit && html_links.length){
                fetchHtml();
            }
            res.on('end', function() {
                final_data[url] = parseHtml(new_data);
                if(html_links.length == 0){
                    storedata();
                }
                connections--;   
            });    
        }).on('error',function(e){
            console.log("In HTMl error"+e.message);
            fetchHtml();
        });
        if(html_links.length == 0 || url == undefined){
        console.log("----ending a connections-----"+url);
            if(URLS.length){
                storedata();
                fetchData();
            }
            else{
                console.log("Nothing to fetch");
                storedata();
               return;  
            }       
        }

    
}

function parseHtml(data){
	let obj = [];
    //var patt = /<a href="(.*?)"/g;
    var patt = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    while(match=patt.exec(data)){
        obj.push(match[1]);
    }
	return obj;
}
function parseXml(data){
	let obj = [];
    let extra = data.split("\n");
    extra.forEach((url) =>{
        if(url.match(/<loc>(.*?)<\/loc>/g) !== null){
            url.match(/<loc>(.*?)<\/loc>/g).map((val) =>{
		    let x = val.replace(/<\/?loc>/g,'');
		    obj.push(x) 
            });
        } 
    });
	return obj;
}
function storedata(){
    fs.writeFile(pathtostore, JSON.stringify(final_data),'utf8',function(error){
        if(error){
            console.log("Error in writing the data:"+error);
        }
        else{
            console.log("--------------data written---------------");
        }
    });
    return;
}




