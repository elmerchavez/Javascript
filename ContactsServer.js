// Elmer Chavez
// IS 210

const EXPRESS       = require('express');
const BODYPARSER    = require('body-parser');
const PG            = require('pg');
const APP           = new EXPRESS();
const PORT          = 3500;
const SUCCESS_CODE  = 200;
const ERROR_CODE    = 400;

APP.use(BODYPARSER.json()); 
APP.use(EXPRESS.urlencoded({ extended: true }))
APP.use(EXPRESS.static('static'));

//*****************************************************************************
// Returns a new instance of a Postgres Client object. 
function createDBClient()
{
    var client = new PG.Client({
        user: 'alfonso',
        host: 'localhost',
        database: 'is210',
        password: 'password',
        port: 5432,
    });

    return client;
}

//*****************************************************************************
// tells the browser to allow code from any origin to access a resource
APP.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

APP.listen(PORT, () => 
{
    console.log(`Listening now on local host:${PORT}`);
});

//*****************************************************************************
// Sends a simple message to let the user know they are connected to the server
APP.get('/', function(req, res)
{
    res.send("Server is up and running!");
});

//*****************************************************************************
// Returns all row elements from the 'contacts' table.  Returns a JSON object
// of all the rows of the DB table.  
//
// usage: http://localhost:3500/list
APP.get('/list', async (req, res) =>
{
    var client = createDBClient();
    client.connect();

    var list = "";
    try{
        const dbResults = await client.query('SELECT * FROM contacts');
        dbResults.rows.forEach(row => {
            list += `${row.first_name}, ${row.last_name}, ${row.phone}, ${row.email}, ${row.age}, ${row.gender}, ${row.id}` + "\n";
        })
        console.log(list);
        res.status(SUCCESS_CODE).json(dbResults); 
    }catch(err){
        console.log("/list: Could not run DB query!");
        res.status(ERROR_CODE);
    }finally{
        client.end();
    }
});

//*****************************************************************************
// Returns a row from the table by specified id.  Returns a string with 
//
// usage: http://localhost:3500/contact?id=x
//      where x=int
APP.post('/contact', async(req, res) =>
{
    var list = "";
    var id = req.query.id;

    var client = createDBClient();
    client.connect();

    try{
        const dbResults = await client.query(`SELECT * FROM contacts WHERE id=${id}`);

        if(dbResults.rowCount == 0)     list = `Found no contact with id=${id}`;
        else                            list = dbResults.rows[0];

        console.log(list);
        res.status(SUCCESS_CODE);
    }
    catch(err){
        list = `Error: Could not select contact by id: ${id}`;
        console.log(list);
        res.status(ERROR_CODE);
    }
    finally{
        client.end();
    }
    
    res.send(list);
});

//*****************************************************************************
// Adds a new row into the table.  Returns the integer id of the row entry 
// successfully added into the DB.  -1 if unsuccessful.  
//
// usage: http://localhost:3500/add?first_name=First&last_name=Last .... 
APP.post('/add', async (req, res) =>
{
    var status = `Error: Could not add contact: ${firstName} ${lastName}`;
    var firstName   = req.query.first_name;
    var lastName    = req.query.last_name;
    var phone       = req.query.phone;
    var email       = req.query.email;
    var age         = req.query.age;
    var gender      = req.query.gender;
    var id          = -1;

    var client = createDBClient();
    client.connect();

    // if age has not been set then do not
    // include it as a param into the DB
    var sqlCmd = `INSERT INTO contacts (first_name, last_name, phone, email, gender, age) VALUES('${firstName}', '${lastName}', '${phone}', '${email}', '${gender}', ${age}) returning id`;
    if(age==null || age=='')
        sqlCmd = `INSERT INTO contacts (first_name, last_name, phone, email, gender) VALUES('${firstName}', '${lastName}', '${phone}', '${email}', '${gender}') returning id`;

    try{
        const dbResults = await client.query(sqlCmd);
        if(dbResults.rowCount == 1){
            id = dbResults.rows[0];
            status = `Successfully added ${firstName} ${lastName}`;
            res.status(SUCCESS_CODE);
        }
    }
    catch(err){
        status = `Error: Could not add contact: ${firstName} ${lastName}`;
        res.status(ERROR_CODE);
    }
    finally{
        client.end();
    }
    
    console.log(status);
    res.send(id);
});

//*****************************************************************************
// Deletes a row from the table by specified id. If successfully deleted, 
// returns the id of the contact deleted.  If no contact was deleted, or if an
// error occurred in the process, returns -1;
//
// usage: http://localhost:3500/delete?id=x
//      where x=integer
APP.post('/delete', async(req, res) =>
{
    var id = req.query.id;
    var msg = `Error: Could not delete contact by id: ${id}`;

    var client = createDBClient();
    client.connect();

    try{
        const dbResults = await client.query(`DELETE FROM contacts WHERE id=${id}`);
        if(dbResults.rowCount >= 1){
            msg = `Successfully deleted contact with id: ${id}`;
            res.status(SUCCESS_CODE);
        }else{
            id = -1;
        }
    }
    catch(err){
        id = -1;
        msg = `Error: Could not delete contact by id: ${id}`;
        res.status(ERROR_CODE);
    }
    finally{
        client.end();
    }
    
    console.log(msg);
    res.send(id);
});

//*****************************************************************************
// Updates  an existing row into the table by specified id. If the DB was 
// successfully updated, returns the id of the entry updated, -1 otherwise.  
//
// usage: http://localhost:3500/update?id=Id&first_name=First&last_name=Last .... 
APP.post('/update', async (req, res) =>
{
    var msg         = `Error: Could not update contact: ${firstName} ${lastName}`;
    var id          = req.query.id;
    var firstName   = req.query.first_name;
    var lastName    = req.query.last_name;
    var phone       = req.query.phone;
    var email       = req.query.email;
    var age         = req.query.age;
    var gender      = req.query.gender;

    var client = createDBClient();
    client.connect();

    if(age=='' || age==null)
        age = 'null';
    sqlCmd = `UPDATE contacts SET first_name='${firstName}', last_name='${lastName}', phone='${phone}', email='${email}', gender='${gender}', age=${age} WHERE id=${id}`;

    try{
        const dbResults = await client.query(sqlCmd);
        if(dbResults.rowCount == 1){
            msg = `Successfully updated ${firstName} ${lastName}`;
            res.status(SUCCESS_CODE);
        }else{
            id = -1;
        }
    }
    catch(err){
        id = -1;
        msg = `Error: Could not update contact: ${firstName} ${lastName}`;
        res.status(ERROR_CODE);
    }
    finally{
        client.end();
    }
    
    console.log(msg);
    res.send(id);
});
