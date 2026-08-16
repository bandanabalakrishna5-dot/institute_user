package com.institute.user.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState

@Composable
fun AppRoot(viewModel: UserViewModel) {
    val state by viewModel.state.collectAsState()
    if (state.loggedIn) {
        DashboardScreen(viewModel = viewModel)
    } else {
        LoginScreen(viewModel = viewModel)
    }
}