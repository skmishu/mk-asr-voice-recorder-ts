import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import { faExclamationCircle, faTrashAlt} from "@fortawesome/free-solid-svg-icons"
import useRecordingsList from "../../hooks/use-recordings-list";
import {RecordingsListProps} from "types/recorder";
import "./styles.css";

export default function RecordingsList({audio}: RecordingsListProps) {
    const {recordings, deleteAudio} = useRecordingsList(audio);

    return (
        <div className="recordings-container">
            {recordings.length > 0 ? (
                <>
                    <h1>Your recordings</h1>
                    <div className="recordings-list">
                        {recordings.map((record) => (
                            <div className="record" key={record.key}>
                                <audio controls src={record.audio}/>
                                <div className="delete-button-container">
                                    <button
                                        className="delete-button"
                                        title="Delete this audio"
                                        onClick={() => deleteAudio(record.key)}
                                    >
                                        <FontAwesomeIcon icon={faTrashAlt} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="no-records">
                    <FontAwesomeIcon icon={faExclamationCircle} size="2x" color="#f2ea02" />
                    <span>You don't have records</span>
                </div>
            )}
        </div>
    );
}
