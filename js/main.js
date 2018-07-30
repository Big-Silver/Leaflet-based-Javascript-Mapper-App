var mymap = L.map('mapid').setView([41.025758, -97.344704], 4);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGFuaWVsYmFsYW4xOTg5IiwiYSI6ImNqazZrYmQxZjFhZ3ozdnFnYmtuNnB2MTkifQ.vRS1P1-6nA9VXmmTzFaqvw', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 5,
    id: 'mapbox.streets',
    accessToken: 'your.mapbox.access.token'
}).addTo(mymap);

var data = [],
    res = [];
var demand_flag = false,
    supply_flag = false;

function geoCodeUrl(pin) {
    var url = `https://maps.googleapis.com/maps/api/geocode/json?address=${pin.address1.replace(/ /g, '+')},${pin.address2.replace(/ /g, '+')}&key=AIzaSyCqjjbTtBAknqTRgsCqUAoBte143u8ILPg`;
    return url;
}

function decodeUrl(address) {
    var post_code;
    for (var j = 0; j < address.length; j++) {
        if (address[j].types[0] == 'postal_code') post_code = address[j].long_name;
    }
    for (var i = 0; i < res.length; i++) {
        if (res[i].zip == post_code) return res[i];
    }
}

function addEle(ele) {
    for (var i = 0; i < data.length; i++) {
        if (data[i].id == ele.id) {
            var dom = 
                `<tbody id="${!demand_flag ? "demand_tbody" : "supply_tbody"}">
                    <tr>
                        <td>ID:</td>
                        <td>${data[i].id}<span id="${data[i].id}_remove" class="close" onclick="removeEle(this, '${!demand_flag ? 'demand' : 'supply'}')"></span></td>
                    </tr>
                    <tr>
                        <td>Name:</td>
                        <td>${data[i].name}</td>
                    </tr>
                    <tr>
                        <td>Address1:</td>
                        <td>${data[i].address1}</td>
                    </tr>
                    <tr>
                        <td>Address2:</td>
                        <td>${data[i].address2}</td>
                    </tr>
                    <tr>
                        <td>City:</td>
                        <td>${data[i].city}</td>
                    </tr>
                    <tr>
                        <td>State:</td>
                        <td>${data[i].state}</td>
                    </tr>
                    <tr>
                        <td>Zip:</td>
                        <td>${data[i].zip}</td>
                    </tr>
                    <tr>
                        <td>Country:</td>
                        <td>${data[i].country}</td>
                    </tr>
                    <tr>
                        <td>Color:</td>
                        <td>${data[i].color}</td>
                    </tr>
                    <tr>
                        <td>Cargo:</td>
                        <td>${data[i].cargo}</td>
                    </tr>
                </tbody>`;
            if (demand_flag == false) {
                $("#demand_table").append(dom);
                demand_flag = true;
            } else if (supply_flag == false) {          
                $("#supply_table").append(dom);
                supply_flag = true;
            } 
            if (supply_flag && demand_flag) {
                $(`#${ele.id}`).addClass("display-none");
            }
        }
    }
    mymap.closePopup();
}

function removeEle(ele, type) {
    var id = ele.id.replace(/_remove/g, '');
    if (type == "supply") {
        $(`#supply_tbody`).remove();
        supply_flag = false;
    }
    else {
        $(`#demand_tbody`).remove();
        demand_flag = false;    
    }
}

function create(ele) {
    $("#supply_tbody").remove();
    $("#demand_tbody").remove();
    $("#contract_text").val('');
    supply_flag = false;
    demand_flag = false;
}

$(document).ready(function(){
    $.ajax({url: "http://localhost:8000/address.json", success: function(result){
        res = result;
        for (var i = 0; i < res.length; i++) {
            data.push(res[i])
            var geoUrl = geoCodeUrl(res[i]);
            $.ajax({url: geoUrl, success: function(result){
                var address = result.results[0].address_components;
                var temp = decodeUrl(address);
                var lat = result.results[0].geometry.location.lat;
                var lng = result.results[0].geometry.location.lng;
                var markerColor = L.AwesomeMarkers.icon({
                    markerColor: temp.color
                });
                var popup = `<p>${temp.name}</p>
                            <p>${temp.cargo}</p>
                            <button id=${temp.id} class="btn btn-info select-button" onclick="addEle(this)">Select</button>`
                var marker = L.marker([lat, lng], {icon: markerColor}).addTo(mymap)
                            .bindPopup(popup)
                            .on('popupopen', function (e) {
                                if (supply_flag && demand_flag) $(`#${temp.id}`).addClass("display-none");
                            });
            },
            fail: function(fail) {
                console.log('fail ====> ', fail);
            }});
        }        
    },
    fail: function(fail) {
        console.log('fail ====> ', fail);
    }});    
});