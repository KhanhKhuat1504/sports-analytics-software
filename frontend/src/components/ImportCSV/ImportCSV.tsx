import React from "react";
import Uploady from "@rpldy/uploady";
import {asUploadButton} from "@rpldy/upload-button";

const ImportButton = asUploadButton((props) => {
    return <button className="import-btn" {...props}>Import CSV</button>
});

const ImportCSV = () => (
	<Uploady destination={{ url: "http://localhost:5000/api/upload/" }} accept=".csv">
		<ImportButton/>
	</Uploady>
);

export default ImportCSV;