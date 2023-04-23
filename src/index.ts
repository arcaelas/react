#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"



const __filename = fileURLToPath( import.meta.url )
const __dirname = path.dirname( __filename )


for(const filename of fs.readdirSync( __dirname )){
    console.log( filename )
}