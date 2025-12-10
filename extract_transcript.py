from youtube_transcript_api import YouTubeTranscriptApi
from test import get_topics_from_transcript

def get(url):
    #url = input("Enter youtube URL: ")
    #video_id = "WmYZd3vd6TA"
    # Split once by 'v=' and then by '&' (if it exists)
    if "v=" in url:
        video_id = url.split("v=")[1].split("&")[0]
    else:
        print("No video ID found.")

    ytt_api = YouTubeTranscriptApi()
    result = ytt_api.fetch(video_id)

    formatted_transcript = "\n".join(
        f"Start: {s.start:.2f}s\nText: {s.text}" for s in result.snippets
    )
    #print(formatted_transcript)
    return_value = get_topics_from_transcript(formatted_transcript)
    return return_value
    #return formatted_transcript
    
    #get_topics_from_transcript(formatted_transcript)

    
    #print(result)



