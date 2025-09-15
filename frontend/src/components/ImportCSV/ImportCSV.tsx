import React from "react";
import Uploady from "@rpldy/uploady";
import UploadButton, {asUploadButton} from "@rpldy/upload-button";

const ImportButton = asUploadButton((props) => {
    return <button className="import-btn">Import CSV</button>
});

const ImportCSV = () => (
	<Uploady destination={{ url: "/" }}>
		<UploadButton/>
	</Uploady>
);

export default ImportCSV;