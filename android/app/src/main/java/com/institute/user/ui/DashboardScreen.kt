package com.institute.user.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.institute.user.data.UserPayload

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(viewModel: UserViewModel) {
    val state by viewModel.state.collectAsState()
    val user = state.user ?: return

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Dashboard") },
                actions = {
                    IconButton(onClick = { viewModel.logout() }) {
                        Icon(Icons.Default.Logout, contentDescription = "Logout")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)
        ) {
            Text(
                "${greeting()}, ${user.displayName}!",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            Text(
                "Institute User Portal",
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.height(16.dp))
            ProfileCard(user)
            Spacer(Modifier.height(16.dp))

            val fields = fieldMap(user)
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(fields) { (label, value) ->
                    InfoRow(label, value)
                }
            }
        }
    }
}

@Composable
private fun ProfileCard(user: UserPayload) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (user.pturl.isNotBlank()) {
                AsyncImage(
                    model = user.pturl,
                    contentDescription = "Profile",
                    modifier = Modifier.size(56.dp).clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
            } else {
                Surface(
                    shape = CircleShape,
                    color = MaterialTheme.colorScheme.primaryContainer
                ) {
                    Text(
                        text = user.displayName.firstOrNull()?.uppercase() ?: "U",
                        style = MaterialTheme.typography.titleLarge,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
            Spacer(Modifier.width(16.dp))
            Column {
                Text(user.displayName, fontWeight = FontWeight.SemiBold)
                Text(user.emlid, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, fontWeight = FontWeight.SemiBold)
        }
    }
}

private fun fieldMap(user: UserPayload): List<Pair<String, String>> {
    val entries = mapOf(
        "User ID" to user.usrid,
        "Role" to user.typ,
        "Email" to user.emlid,
        "Mobile" to user.mbleno,
        "Class" to user.clsnm,
        "Section" to user.secnm,
        "Roll Number" to user.stdrolid,
        "Staff ID" to user.stfrolid,
        "Driver" to user.drvnm,
        "Vehicle" to user.velno,
        "Academic Year" to user.acdmcyr,
    )
    return entries.filterValues { it.isNotBlank() }.toList()
}

private fun greeting(): String {
    val hour = java.time.LocalTime.now().hour
    return when {
        hour < 12 -> "Good Morning"
        hour < 17 -> "Good Afternoon"
        else -> "Good Evening"
    }
}