package ro.uaic.info.apixcontroller;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.support.annotation.RequiresApi;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

public class MainActivity extends AppCompatActivity {
    private static final int PICKFILE_REQUEST_CODE = 1;
    private ValueCallback<Uri[]> mFilePathCallback;

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == PICKFILE_REQUEST_CODE) {
            Uri result = data == null || resultCode == RESULT_OK ? null : data.getData();
            Uri[] resultsArray = new Uri[1];
            resultsArray[0] = result;
            if (result != null)
                mFilePathCallback.onReceiveValue(resultsArray);
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.KITKAT)
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        final int id = getIntent().getExtras().getInt("id");

        WebView webView = (WebView) findViewById(R.id.main_web_view);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                Log.d("FileChooser", "showFileChooser called");
                mFilePathCallback = filePathCallback;
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.setType("image/*");
                startActivityForResult(intent, PICKFILE_REQUEST_CODE);
                return true;
            }

            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress == 100) {
                    view.evaluateJavascript("connectToServer(" +id +");", null);
                    Log.d("Webview", view.getSettings().getUserAgentString());
                }
            }
        });


        webView.loadUrl("file:///android_asset/www/index.html");

    }
}
