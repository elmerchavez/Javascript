// Elmer Chavez
// IS 210


// constants used for indexing the cells
// for each row of the html table element
const FIRST_NAME_INDEX  = 0;
const LAST_NAME_INDEX   = 1;
const PHONE_INDEX       = 2;
const EMAIL_INDEX       = 3;
const GENDER_INDEX      = 4;
const AGE_INDEX         = 5;
const ID_INDEX          = 6;

// constants correspond to the html select element for gender
const NO_GENDER         = 0;
const MALE_GENDER       = 1;
const FEMALE_GENDER     = 2;
const OTHER_GENDER      = 3;

// various colors to control the table highlights
const BACK_GROUND_COLOR     = "rgb(235, 235, 225)";
const ROW_HOVER_COLOR       = "rgb(200, 200, 200)";
const TH_HOVER_COLOR        = "rgb(128, 127, 135)";
const TH_BACK_GROUND_COLOR  = "rgb(210, 210, 200)";

const DB_SUCCESS    = 200;

//const IP_ADDRESS    = "localhost";
const IP_ADDRESS    = "192.168.0.10";
const PORT_NUM      = "3500";

// local variables 
document.selectedRow        = null;     // corresponds to html table row element
document.selectedIndex      = -1;       // corresponds to html table row index
document.isAscendingOrder   = false;    // flag to deternine ascending/descending state

function $(elementName) { return document.getElementById(elementName); }  

//*****************************************************************************
// This event is first called when the browser window loads. We need to call
// the server and load all the contacts from the DB into the html table.
window.onload = function()
{
    var xhttp = new XMLHttpRequest();

    // set up call back to load DB into html table
    xhttp.onload = function() {
        if(xhttp.status == DB_SUCCESS){ 
            loadTableFromDB(xhttp.responseText);
        }
    };

    // set up call back to handle error
    xhttp.onerror = function() {
        alert("Failed to load DB contacts into HTML table!");
    };

    // send the request to the server
    xhttp.open('GET', `http://${IP_ADDRESS}:${PORT_NUM}/list`, true);
    xhttp.send();
}

//*****************************************************************************
// xhttpContactData is JSON formated data of all entries of DB table.
function loadTableFromDB(xhttpContactData)
{
    var contactsJSON = JSON.parse(xhttpContactData);
    if(contactsJSON == null)
        return;

    contactsJSON.rows.forEach(row =>{
        insertNewHTMLRow(row['first_name'],row['last_name'],row['phone'],
                         row['email'],row['gender'],row['age'], row['id']);
    })
}

//*****************************************************************************
// Makes request to server to update the contact in the DB with the new values.
function updateDBContact(firstName,lastName,phoneNum,email,gender,age,id)
{
    var xhttp = new XMLHttpRequest();

    // call back - if DB successfully updated contact, 
    // go ahead and update the html table 
    xhttp.onload = function(event, fName=firstName, lName=lastName) {
        if(xhttp.status == DB_SUCCESS){ 
            updateHTMLTableRow(firstName,lastName,phoneNum,email,gender,age,id);
        }
    };

    // call back to handle error
    xhttp.onerror = function(event, fName=firstName, lName=lastName) {
        alert(`Failed to update DB contact: ${fName} ${lName}`);
    };

    // send the request to the server
    var params = `?id=${id}&first_name=${firstName}&last_name=${lastName}&phone=${phoneNum}&email=${email}&gender=${gender}&age=${age}`;
    xhttp.open('POST', `http://${IP_ADDRESS}:${PORT_NUM}/update${params}`, true);
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhttp.send();
}

//*****************************************************************************
// Adds a new contact to the database.  
function addDBContact(firstName,lastName,phoneNum,email,gender,age)
{
    var xhttp = new XMLHttpRequest();

    // call back to load DB into html table
    xhttp.onload = function(event, fName=firstName, lName=lastName) {
        if(xhttp.status == DB_SUCCESS){ 
            // set the id that was generated from the DB
            var id = JSON.parse(xhttp.responseText).id;
            addRowToHTMLTable(firstName,lastName,phoneNum,email,gender,age,id);
        }
    };

    // call back to handle error
    xhttp.onerror = function(event, fName=firstName, lName=lastName) {
        alert(`Failed to add DB contact: ${fName} ${lName}`);
    };

    // send the request to the server
    var params = `?first_name=${firstName}&last_name=${lastName}&phone=${phoneNum}&email=${email}&gender=${gender}&age=${age}`;
    xhttp.open('POST', `http://${IP_ADDRESS}:${PORT_NUM}/add${params}`, true);
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhttp.send();
}

//*****************************************************************************
// Deletes contact from database by specified id.  First/last names are only
// to print confirmation message.  
function deleteDBContact(id, firstName, lastName)
{
    var xhttp = new XMLHttpRequest();

    // call back to load DB into html table
    xhttp.onload = function(event, fName=firstName, lName=lastName){
        if(xhttp.status == DB_SUCCESS){ 
            deleteContactFromHtmlTable(id,firstName,lastName);
        }
    };

    // call back to handle error
    xhttp.onerror = function(event, fName=firstName, lName=lastName){
        alert(`Failed to delete DB contact: ${fName} ${lName}`);
    };

    // send request to server
    var params = `?id=${id}`;
    xhttp.open('POST', `http://${IP_ADDRESS}:${PORT_NUM}/delete${params}`, true);
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhttp.send();
}

//*****************************************************************************
// Clears out all the contact edit fields, disables the buttons and resets
// document variables.
function onClickClearFieldsButton()
{
    resetContactEditElements();
    resetTableHighlights();
}

//*****************************************************************************
// clears out all contact text fields and disables edit buttons
function resetContactEditElements()
{
    $("first_name_element").value       ="";
    $("last_name_element").value        ="";
    $("phone_number_element").value     ="";
    $("email_element").value            ="";
    $("age_element").value              ="";
    $("id_element").value               ="";
    $("gender_element").selectedIndex   = NO_GENDER;
    disableDeleteButton(true);
    disableSaveButton(true);
    disableClearButton(true);
}

//*****************************************************************************
// de-selects the highlighted row in the html table
function resetTableHighlights()
{
    var length = $("contacts_table").rows.length;
    for(var i=1; i<length; i++){
        $("contacts_table").rows[i].style.backgroundColor = BACK_GROUND_COLOR;
    }
    document.selectedRow = null;
    document.selectedIndex = -1;
}

//*****************************************************************************
// Called when user clicks on 'Delete Contact' button
function onClickDeleteContactButton()
{
    if(document.selectedRow == null)
        return;

    var firstName = document.selectedRow.cells[FIRST_NAME_INDEX].innerHTML;
    var lastName = document.selectedRow.cells[LAST_NAME_INDEX].innerHTML;
    var id = document.selectedRow.cells[ID_INDEX].innerHTML;

    if(confirm("Delete contact? " + firstName + " " + lastName)){
            deleteDBContact(id, firstName, lastName);
    }
}

//*****************************************************************************
// Called after the server successfully deletes contact from DB
function deleteContactFromHtmlTable(id, firstName, lastName)
{
    if(document.selectedRow != null)
        document.selectedRow.remove();
    resetContactEditElements();
    resetTableHighlights();
}

//*****************************************************************************
// Called when the user clicks on the 'Save/Update' button. 
function onClickSaveContactButton()
{
    // grab all of the contact fields
    var firstName   = $("first_name_element").value.trim();
    var lastName    = $("last_name_element").value.trim();
    var phoneNum    = $("phone_number_element").value.trim();
    var email       = $("email_element").value.trim();
    var gender      = $("gender_element").value.trim();
    var age         = $("age_element").value.trim();
    var id          = $("id_element").value.trim();

    // make sure we have either a first or last name
    if(firstName==""  &&  lastName==""){
        alert("Please enter either a first name or a last name.");
        $("first_name_element").focus();
        $("first_name_element").select();
        return;
    }

    if(firstName.length > 30){
        alert("Please limit name to less than 30 characters.");
        $("first_name_element").focus();
        $("first_name_element").select();
        return;
    }

    if(lastName.length > 30){
        alert("Please limit name to less than 30 characters.");
        $("last_name_element").focus();
        $("last_name_element").select();
        return;
    }

    if(phoneNum.length > 25){
        alert("Please limit phone number to less than 25 characters.");
        $("phone_number_element").focus();
        $("phone_number_element").select();
        return;
    }

    if(email.length > 40){
        alert("Please limit email address to less than 40 characters.");
        $("email_element").focus();
        $("email_element").select();
        return;
    }

    if(parseInt(age,10)>120  ||  parseInt(age,10)<1){
        alert("Please enter an age between 1 - 120");
        $("age_element").focus();
        $("age_element").select();
        return;
    }

    if(id.length > 10){
        alert("Please limit ID to less than 10 digits.");
        $("id_element").focus();
        $("id_element").select();
        return;
    }


    // are we modifying an existing contact?
    if(document.selectedRow != null){
        var previousFirstName = document.selectedRow.cells[FIRST_NAME_INDEX].innerHTML;
        var previousLastName = document.selectedRow.cells[LAST_NAME_INDEX].innerHTML;

        if(!confirm(`Update existing contact? ${previousFirstName} ${previousLastName}`))
            return;

        updateDBContact(firstName,lastName,phoneNum,email,gender,age,id);
    }
    // or adding a new contact?
    else{
        addDBContact(firstName,lastName,phoneNum,email,gender,age);
    }
}

//*****************************************************************************
// Updates the current highlighted row of the html table with the specified values
function updateHTMLTableRow(firstName, lastName, phoneNum, email, gender, age, id)
{
    var row = document.selectedRow;

    row.cells[FIRST_NAME_INDEX].innerHTML = firstName;
    row.cells[LAST_NAME_INDEX].innerHTML  = lastName;
    row.cells[PHONE_INDEX].innerHTML      = phoneNum;
    row.cells[EMAIL_INDEX].innerHTML      = email;
    row.cells[GENDER_INDEX].innerHTML     = gender;
    row.cells[AGE_INDEX].innerHTML        = age;
    row.cells[ID_INDEX].innerHTML         = id;

    document.selectedRow.style.backgroundColor = ROW_HOVER_COLOR;
    disableDeleteButton(false);
    disableSaveButton(true);
    disableClearButton(false);
}

//*****************************************************************************
// Add a new row to the html table with the specified values
function addRowToHTMLTable(firstName, lastName, phoneNum, email, gender, age, id)
{
    var newRow = insertNewHTMLRow(firstName,lastName,phoneNum,email,gender,age,id);

    $("id_element").value = id;
    document.selectedRow = newRow;
    document.selectedIndex = newRow.rowIndex;
    document.selectedRow.style.backgroundColor = ROW_HOVER_COLOR;

    disableDeleteButton(false);
    disableSaveButton(true);
    disableClearButton(false);
}

//*****************************************************************************
// Inserts a new row into the html table with the specified values
function insertNewHTMLRow(firstName,lastName,phone,email,gender,age,id)
{
    var insert_index = $("contacts_table").rows.length;
    var newRow = $("contacts_table").insertRow(insert_index);

    (newRow.insertCell(FIRST_NAME_INDEX)).innerHTML = firstName;
    (newRow.insertCell(LAST_NAME_INDEX)).innerHTML  = lastName;
    (newRow.insertCell(PHONE_INDEX)).innerHTML      = phone;
    (newRow.insertCell(EMAIL_INDEX)).innerHTML      = email;
    (newRow.insertCell(GENDER_INDEX)).innerHTML     = gender;
    (newRow.insertCell(AGE_INDEX)).innerHTML        = age;
    (newRow.insertCell(ID_INDEX)).innerHTML         = id;

    // add the event listeners to the new row element
    newRow.setAttribute("onclick", "onClickTableRow(event)");
    newRow.setAttribute("onMouseOver", "addRowHighlight(event)");
    newRow.setAttribute("onMouseOut", "removeRowHighlight(event)");

    return newRow;
}

//*****************************************************************************
// This event is called anytime the html input text fields are edited 
function onChangeContact()
{
    disableDeleteButton(true);
    disableSaveButton(false);
    disableClearButton(false);
}

//*****************************************************************************
// toggle the button and change the button border color accordingly
function disableDeleteButton(disable)
{
    $("delete_contact_button").disabled = disable;
    var color = "1px solid black";
    if(!disable)    
        color = "1px solid red";
    $("delete_contact_button").style.border = color;
}

function disableSaveButton(disable)
{
    $("save_contact_button").disabled = disable;
    var color = "1px solid black";
    if(!disable)    
        color = "1px solid green";
    $("save_contact_button").style.border = color;
}

function disableClearButton(disable)
{
    $("clear_all_button").disabled = disable;
    var color = "1px solid black";
    if(!disable)    
        color = "1px solid aqua";
    $("clear_all_button").style.border = color;
}

//*****************************************************************************
// When the user clicks on a row in the html table then we need to load
// all the cells of that row into the input text fields either for editing
// or for deleting.  
function onClickTableRow(event)
{
    resetTableHighlights();
    var rowElement = event.currentTarget;
    document.selectedIndex = event.currentTarget.rowIndex;
    addRowHighlight(event);

    $("first_name_element").value       =rowElement.cells[FIRST_NAME_INDEX].innerHTML;
    $("last_name_element").value        =rowElement.cells[LAST_NAME_INDEX].innerHTML;
    $("phone_number_element").value     =rowElement.cells[PHONE_INDEX].innerHTML;
    $("email_element").value            =rowElement.cells[EMAIL_INDEX].innerHTML;
    $("age_element").value              =rowElement.cells[AGE_INDEX].innerHTML;
    $("id_element").value               =rowElement.cells[ID_INDEX].innerHTML;
    $("gender_element").selectedIndex   = getGender(rowElement.cells[GENDER_INDEX].innerHTML);

    disableDeleteButton(false);
    disableSaveButton(true);
    disableClearButton(false);
    document.selectedRow = rowElement;
}

//*****************************************************************************
// This function is called when the user clicks on the "First Name" table 
// header.  We want to sort the html element table by first name.
function onClickFirstNameTableHeader(event)
{
    document.isAscendingOrder = !document.isAscendingOrder;
    sortTableElementsBy("first_name");
}

//*****************************************************************************
// This function is called when the user clicks on the "First Name" table 
// header.  We want to sort the html element table by last name.
function onClickLastNameTableHeader(event)
{
    document.isAscendingOrder = !document.isAscendingOrder;
    sortTableElementsBy("last_name");
}

//*****************************************************************************
// Here we store all of the html table rows into an array of Contact objects so 
// that we can sort either by first or last name.  We then remove all of the 
// elements from the html table and then reinsert them in the desired order.  
function sortTableElementsBy(sortBy)
{
    var contact; 
    var contactList     = new Array();
    var tableElement    = $("contacts_table");
    var rows            = tableElement.rows;
    var numTableRows    = tableElement.rows.length;
    
    // Iterate through all the table elements
    // and create Contact objects and insert into
    // our array for sorting.  
    for(var index=1; index<numTableRows; index++){ 
        contact             = new Contact(sortBy);
        contact.firstName   = rows[index].cells[FIRST_NAME_INDEX].innerHTML;
        contact.lastName    = rows[index].cells[LAST_NAME_INDEX].innerHTML;
        contact.row         = rows[index];
        contactList.push(contact);
    }

    contactList.sort(Contact.compare);

    // now we want to remove all of the
    // html table rows and re-insert the
    // sorted rows back into the table
    var oldRow;
    contactList.forEach(contactEntry => {           
        oldRow = contactEntry.row;
        oldRow.remove();
        insertNewHTMLRow(oldRow.cells[FIRST_NAME_INDEX].innerHTML,
                         oldRow.cells[LAST_NAME_INDEX].innerHTML,
                         oldRow.cells[PHONE_INDEX].innerHTML,
                         oldRow.cells[EMAIL_INDEX].innerHTML,
                         oldRow.cells[GENDER_INDEX].innerHTML,
                         oldRow.cells[AGE_INDEX].innerHTML,
                         oldRow.cells[ID_INDEX].innerHTML);
    });

    resetTableHighlights();
    resetContactEditElements();
}

//*****************************************************************************
// When the mouse enters and leaves each row of the table these two functions 
// are called to either hightlight the row or to remove the hightlight.
function addRowHighlight(event)
{
    event.currentTarget.style.backgroundColor = ROW_HOVER_COLOR;
}

function removeRowHighlight(event)
{
    if(event.currentTarget.rowIndex == document.selectedIndex)
        return;
    event.currentTarget.style.backgroundColor = BACK_GROUND_COLOR;
}

//*****************************************************************************
// When the mouse enters the table headers these two functions are called 
// to either highlight the specific header cell or to remove the highlight
function addCellHighlight(event)
{
    event.currentTarget.style.backgroundColor = TH_HOVER_COLOR;
}

function removeCellHighlight(event)
{
    event.currentTarget.style.backgroundColor = TH_BACK_GROUND_COLOR;
}

//*****************************************************************************
// Corresponds to the 'gender_element' html select element 
function getGender(gender)
{
    if(gender == "Male")    return MALE_GENDER;
    if(gender == "Female")  return FEMALE_GENDER;
    if(gender == "Other")   return OTHER_GENDER;

    return NO_GENDER; 
}

//*****************************************************************************
// Captures certain keystrokes when the user enters data into the contact edit
// fields.  By default, pressing 'enter' when in one of the text input fields
// causes the webpage to refresh.  We need to override that function.  Also
// disallow certain characters when inputing integer values for age and id.
function onKeyPress(event)
{
    var element = event.currentTarget;
    switch(event.keyCode){
        case 13: // 'enter'
            event.preventDefault();   
            return;
        case 43: // '+'
        case 45: // '-'
        case 46: // '.'
            if(element.id=="age_element"  ||  element.id=="id_element"){
                event.preventDefault();
                return;
            }
            break;
        default:    
            break;
    }

    onChangeContact();
}


//*****************************************************************************
//*****************************************************************************
// This class is used to keep track of the various row elements as they are
// being sorted by either first or last name.  It is basically a key->value
// pair where either the first or last name can be the "key" and the html table
// row is the "value". The 'sortBy' variable tells us which "key" to use, either
// first or last.  
class Contact 
{
    constructor(pSortBy) {
        this.firstName  = "";
        this.lastName   = "";
        this.row        = null;
        this.sortBy     = pSortBy;      // 'first_name' | 'last_name'
    }

    //*******************************************************
    // contactA and contactB are of class 'Contact'.  
    // Returns 1 if A > B, -1 if A < B, 0 if A == B
    static compare(contactA, contactB)
    {
        // determine if we are sorting by first or last name
        var nameA = contactA.firstName.toLowerCase(); 
        var nameB = contactB.firstName.toLowerCase();
        var order = document.isAscendingOrder;
        if(contactA.sortBy == "last_name"){
            nameA = contactA.lastName.toLowerCase();
            nameB = contactB.lastName.toLowerCase();
        }

        // special case: When two names are identical,
        // need to then compare the other name as well
        if(nameA == nameB){
            if(contactA.sortBy == "first_name"){
                nameA += contactA.lastName;
                nameB += contactB.lastName;
            }else if(contactA.sortBy == "last_name"){
                nameA += contactA.firstName;
                nameB += contactB.firstName;
            }
        }

        // do the actual comparison, return the result
        if (nameA < nameB)          return (order ? -1 : 1); 
        else if (nameA > nameB)     return (order ? 1 : -1);
        return 0; 
    }
}





