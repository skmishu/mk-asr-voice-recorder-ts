import {useState, useEffect} from "react";
import {startRecording, saveRecording} from "handlers/recorder-controls";
import {Recorder, Interval, AudioTrack, MediaRecorderEvent} from "types/recorder";

const initialState: Recorder = {
    recordingMinutes: 0,
    recordingSeconds: 0,
    initRecording: false,
    mediaStream: null,
    mediaRecorder: null,
    audio: null,
};

export default function useRecorder() {
    const [recorderState, setRecorderState] = useState<Recorder>(initialState);

    async function postBlobFile(url: URL, blob: Blob) {
        try {
            const formData = new FormData();
            formData.append('file', blob);
            const options = {
                method: 'POST',
                body: formData
            };
            await fetch(url, options).then(function (res){
                console.dir(res.body)
                return res.json()
            }).then(function (data){
                console.log("ASR Response")
                console.log(data)
            });
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        const MAX_RECORDER_TIME = 5;
        let recordingInterval: Interval = null;

        if (recorderState.initRecording)
            recordingInterval = setInterval(() => {
                setRecorderState((prevState: Recorder) => {
                    if (
                        prevState.recordingMinutes === MAX_RECORDER_TIME &&
                        prevState.recordingSeconds === 0
                    ) {
                        typeof recordingInterval === "number" && clearInterval(recordingInterval);
                        return prevState;
                    }

                    if (prevState.recordingSeconds >= 0 && prevState.recordingSeconds < 59)
                        return {
                            ...prevState,
                            recordingSeconds: prevState.recordingSeconds + 1,
                        };
                    else if (prevState.recordingSeconds === 59)
                        return {
                            ...prevState,
                            recordingMinutes: prevState.recordingMinutes + 1,
                            recordingSeconds: 0,
                        };
                    else return prevState;
                });
            }, 1000);
        else typeof recordingInterval === "number" && clearInterval(recordingInterval);

        return () => {
            typeof recordingInterval === "number" && clearInterval(recordingInterval);
        };
    });

    useEffect(() => {
        setRecorderState((prevState) => {
            if (prevState.mediaStream)
                return {
                    ...prevState,
                    mediaRecorder: new MediaRecorder(prevState.mediaStream),
                };
            else return prevState;
        });
    }, [recorderState.mediaStream]);

    useEffect(() => {
        const recorder = recorderState.mediaRecorder;
        let chunks: Blob[] = [];

        if (recorder && recorder.state === "inactive") {
            recorder.start();

            recorder.ondataavailable = (e: MediaRecorderEvent) => {
                chunks.push(e.data);
            };

            recorder.onstop = async () => {
                const blob = new Blob(chunks, {type: "audio/ogg; codecs=opus"});
                chunks = [];

                console.log("recorder stopped")
                try {
                    await postBlobFile(new URL("http://192.168.50.194:5000/recognize_audio"), blob)
                    /*
                    await fetch("http://192.168.50.194:5000/recognize_audio")
                        .then((response) => {
                            console.log("responseOutput" + response.json())
                            response.json()
                        })
                        .then((data) => {
                            console.log(data)
                            // setTestResponseData(data)
                        })
                        */
                } catch (e) {
                    console.log("fetch_error: " + e)
                }

                setRecorderState((prevState: Recorder) => {
                    if (prevState.mediaRecorder)
                        return {
                            ...initialState,
                            audio: window.URL.createObjectURL(blob),
                        };
                    else return initialState;
                });
            };
        }

        return () => {
            if (recorder) recorder.stream.getAudioTracks().forEach((track: AudioTrack) => track.stop());
        };
    }, [recorderState.mediaRecorder]);

    return {
        recorderState,
        startRecording: () => startRecording(setRecorderState),
        cancelRecording: () => setRecorderState(initialState),
        saveRecording: () => saveRecording(recorderState.mediaRecorder),
    };
}
