package com.institute.user

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.institute.user.ui.AppRoot
import com.institute.user.ui.UserViewModel
import com.institute.user.ui.theme.InstituteUserTheme

class MainActivity : ComponentActivity() {

    private val viewModel: UserViewModel by viewModels {
        UserViewModel.Factory(this)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            InstituteUserTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppRoot(viewModel = viewModel)
                }
            }
        }
    }
}