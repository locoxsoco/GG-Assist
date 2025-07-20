import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Container,
  CssBaseline,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
  Tooltip,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import FilterListIcon from "@mui/icons-material/FilterList";
import EventIcon from "@mui/icons-material/Event";
import LockIcon from "@mui/icons-material/Lock";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LabelIcon from "@mui/icons-material/Label";
import EmailIcon from "@mui/icons-material/Email";
import SummarizeIcon from "@mui/icons-material/Summarize";
import { styled } from "@mui/material/styles";

import "./App.css";

// Create dark theme
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    secondary: {
      main: "#f48fb1",
      light: "#f8bbd9",
    },
    background: {
      primary: "#0a0a0f",
      secondary: "#0d0d12",
    },
    text: {
      primary: "#e8e8e8",
      secondary: "#a0a0a0",
    },
    accent: {
      primary: "#76b900", /* NVIDIA Green */
      secondary: "#8fd619", /* Lighter NVIDIA Green */
    }
  },
});

const MessageBox = styled(Paper)(({ theme, source }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  color: theme.palette.accent.primary,
  textAlign: source === "user" ? "right" : "left",
}));

const SummaryCard = ({ summary }) => {
  const handleViewEmail = () => {
    const emailUrl = `https://mail.google.com/mail/u/0/#inbox/${summary.emailId}`;
    window.open(emailUrl, '_blank');
  };

  return (
    <Paper 
      sx={{ 
        p: 2, 
        mb: 1, 
        bgcolor: "grey.900", 
        borderRadius: 2,
        border: 1,
        borderColor: "accent.primary"
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold" color="accent.primary">
          Email Summary
        </Typography>
        <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6 }}>
          {summary.response}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<EmailIcon />}
            onClick={handleViewEmail}
            sx={{ 
              borderColor: "accent.primary",
              color: "accent.primary",
              "&:hover": {
                bgcolor: "accent.primary",
                color: "common.black"
              }
            }}
          >
            View Email
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

// Replace the Typography line with this EventCard component:
const EventCard = ({ event }) => {
  const handleAddToCalendar = () => {
    // Create a Google Calendar URL
    const startDate = new Date(event.datetime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(new Date(event.datetime).getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.event)}&dates=${startDate}/${endDate}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const handleViewEmail = () => {
    const emailUrl = `https://mail.google.com/mail/u/0/#inbox/${event.emailId}`;
    window.open(emailUrl, '_blank');
  };

  return (
    <Paper 
      sx={{ 
        p: 2, 
        mb: 1, 
        bgcolor: "grey.900", 
        borderRadius: 2,
        border: 1,
        borderColor: "accent.primary"
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold" color="accent.primary">
          Event: {event.event}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Time: {new Date(event.datetime).toUTCString()}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<EmailIcon />}
            onClick={handleViewEmail}
            sx={{ 
              borderColor: "accent.primary",
              color: "accent.primary",
              "&:hover": {
                bgcolor: "accent.primary",
                color: "common.black"
              }
            }}
          >
            View Email
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<CalendarTodayIcon />}
            onClick={handleAddToCalendar}
            sx={{ 
              bgcolor: "accent.primary",
              "&:hover": {
                bgcolor: "accent.secondary"
              }
            }}
          >
            Add to Calendar
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

const LabelCard = ({ labels }) => {
  const handleViewEmail = () => {
    const emailUrl = `https://mail.google.com/mail/u/0/#inbox/${labels.emailId}`;
    window.open(emailUrl, '_blank');
  };

  return (
    <Paper 
      sx={{ 
        p: 2, 
        mb: 1, 
        bgcolor: "grey.900", 
        borderRadius: 2,
        border: 1,
        borderColor: "accent.primary"
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" fontWeight="bold" color="text.primary">
              Labels:
            </Typography>
            {labels.labels && labels.labels.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
              {labels.labels.map((label, index) => (
                <Paper
                  key={index}
                  sx={{
                    px: 1,
                    py: 0.5,
                    bgcolor: "accent.primary",
                    color: "common.black",
                    borderRadius: 1,
                    fontSize: "0.75rem",
                  }}
                >
                  {label}
                </Paper>
              ))}
            </Box>
            )}
          </Box>
      </Box>
      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<EmailIcon />}
            onClick={handleViewEmail}
            sx={{ 
              borderColor: "accent.primary",
              color: "accent.primary",
              "&:hover": {
                bgcolor: "accent.primary",
                color: "common.black"
              }
            }}
          >
            View Email
          </Button>
        </Box>
    </Paper>
  );
};

function App() {
  const [messages, setMessages] = useState([]);
  const today = new Date().toISOString().slice(0, 10);
  const [filterDate, setFilterDate] = useState(today);
  const [emails, setEmails] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Ready");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const getEmails = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/get-emails", {
        params: { filterDate },
      });
      setEmails(response.data.response);
    } catch (error) {
      console.error("Error receiving emails:", error);
    }
  };

  const detectEvents = async () => {
    const inputText = "Hey gmail, detect calendar events";
    setInput(inputText);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        source: "system",
        text: "Welcome to the GG-Assist. How can I assist you today?",
        type: "message",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setEmails([
      {
        id: "",
        internalDate: Date.now(),
        snippet: "Loading emails...",
      },
    ]);
    getEmails();
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = { source: "user", text: input, type: "message", timestamp: new Date().toLocaleTimeString() };
    setMessages([...messages, userMessage]);
    setInput("");
    setStatus("Processing");
    setIsTyping(true);

    try {
      console.log("Sending message to RISE:", input.trim());
      const response = await axios.post(
        "http://localhost:5000/api/send-message",
        {
          message: input.trim(),
          filter_date: filterDate,
        }
      );
      setMessages((prev) => [
        ...prev,
        { source: "assistant", answer: response.data.response, text: response.data.response + " (0/" + emails.length + ")", type: response.data.type, timestamp: new Date().toLocaleTimeString() },
      ]);
      if (response.data.type === "calendar_event") {
        const collectedEvents = []; // Array to collect all events
        for (let i = 0; i < emails.length; i++) {
          const email = emails[i];
          console.log("Processing email:", email.id);
          const response = await axios.post(
            "http://localhost:5000/api/detect-email-event",
            {
              email_id: email.id,
            }
          );
          console.log("Processed email response:", response.data);
          if (response.data.event != null) {
            collectedEvents.push({ ...response.data, emailId: email.id });
          }
          setMessages((prev) => {
            const updatedMessages = [...prev];
            const lastMessageIndex = updatedMessages.length - 1;
            
            updatedMessages[lastMessageIndex] = {
              ...updatedMessages[lastMessageIndex],
              text: updatedMessages[lastMessageIndex].answer + " (" + (i + 1) + "/" + emails.length + ")",
              timestamp: new Date().toLocaleTimeString(), 
              events: collectedEvents, // Store all collected events
            };
            console.log("Updated messages with events:", i);
            return updatedMessages;
          });
        }
      } else if (response.data.type === "summarize_email") {
        const collectedSummaries = []; // Array to collect all emails
        for (let i = 0; i < emails.length; i++) {
          const email = emails[i];
          console.log("Processing email:", email.id);
          const response = await axios.post(
            "http://localhost:5000/api/summarize-email",
            {
              email_id: email.id,
            }
          );
          console.log("Processed summarized email response:", response.data);
          if (response.data != null) {
            collectedSummaries.push({ ...response.data, emailId: email.id });
          }
          setMessages((prev) => {
            const updatedMessages = [...prev];
            const lastMessageIndex = updatedMessages.length - 1;
            
            updatedMessages[lastMessageIndex] = {
              ...updatedMessages[lastMessageIndex],
              text: updatedMessages[lastMessageIndex].answer + " (" + (i + 1) + "/" + emails.length + ")",
              timestamp: new Date().toLocaleTimeString(), 
              summaries: collectedSummaries, // Store all collected summaries
            };
            console.log("Updated messages with summaries:", i);
            return updatedMessages;
          });
        }
      } else if (response.data.type === "generate_labels") {
        const collectedLabels = []; // Array to collect all labels
        for (let i = 0; i < emails.length; i++) {
          const email = emails[i];
          console.log("Processing email:", email.id);
          const response = await axios.post(
            "http://localhost:5000/api/generate-email-labels",
            {
              email_id: email.id,
            }
          );
          console.log("Processed labeling email response:", response.data);
          if (response.data.labels.length > 0) {
            collectedLabels.push({ ...response.data, emailId: email.id });
          } else {
            collectedLabels.push({ ...{labels: ["general"]}, emailId: email.id });
          }
          console.log("collectedLabels:", collectedLabels);
          setMessages((prev) => {
            const updatedMessages = [...prev];
            const lastMessageIndex = updatedMessages.length - 1;
            
            updatedMessages[lastMessageIndex] = {
              ...updatedMessages[lastMessageIndex],
              text: updatedMessages[lastMessageIndex].answer + " (" + (i + 1) + "/" + emails.length + ")",
              timestamp: new Date().toLocaleTimeString(), 
              labels: collectedLabels, // Store all collected labels
            };
            console.log("Updated messages with labels:", i);
            return updatedMessages;
          });
        }
      }
      setStatus("Ready");
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          source: "system",
          text: `Error communicating with RISE: ${
            error.response?.data?.error || error.message
          }`,
          type: "message",
        },
      ]);
      setStatus("Error: Communication failed");
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) sendMessage(e);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Container maxWidth="false">
        <CssBaseline />
        <Box>
          <Box
            sx={{
              p: 2
            }}
          >
            <Typography variant="h4" fontWeight="bold" sx={{color: "accent.primary"}}>
              GG-Assist
            </Typography>
            <Typography
              variant="body1"
              sx={{ mt: 1, display: "flex", gap: 1, color:"accent.secondary", borderBottom: 1, borderColor: "grey.800", pb: 2}}
            >
              <LockIcon fontSize="small" /> Dominate your inbox with a Local Gmail AI Assistant. Privacy by design, running locally to keep your personal data private.
            </Typography>
          </Box>
          <Grid container>
            <Grid item size={{ xs: 12, md: 7 }} sx={{ p: 2 }}>
              <Box
                sx={{ mb: 2, display: "flex", gap: 2 }}
              >
                <TextField
                  label="Filter by date"
                  type="date"
                  size="small"
                  value={filterDate || ""}
                  onChange={(e) => setFilterDate(e.target.value)}
                  sx={{ borderRadius: 1 }}
                />
                <Tooltip title="Filter emails">
                  <span>
                    <IconButton
                      color="error"
                      onClick={getEmails}
                      disabled={!filterDate}
                    >
                      <FilterListIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={detectEvents}
                  startIcon={<EventIcon />}
                  sx={{ fontWeight: "bold" }}
                >
                  Event Detector
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<LabelIcon />}
                  sx={{ fontWeight: "bold" }}
                  onClick={() => setInput("Hey gmail, generate labels for my emails")}
                >
                  Generate Labels
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<SummarizeIcon />}
                  sx={{ fontWeight: "bold" }}
                  onClick={() => setInput("Hey gmail, summarize my emails")}
                >
                  Summarize Emails
                </Button>
              </Box>
              <Paper
                variant="outlined"
                sx={{ p: 2, mb: 2 }}
              >
                <Typography variant="h6" gutterBottom>
                  Emails
                </Typography>
                <List>
                  {emails.map((msg, index) => (
                    <ListItem
                      key={index}
                      component="a"
                      href={"https://mail.google.com/mail/u/0/#inbox/" + msg.id}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        bgcolor: "grey.900",
                        color: "common.white",
                        borderRadius: 1,
                        mb: 1,
                        "&:hover": {
                          bgcolor: "grey.800",
                          color: "primary.light",
                        },
                      }}
                    >
                      <ListItemText
                        primary={`${new Intl.DateTimeFormat("en-US", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        }).format(msg.internalDate)} | ${msg.snippet}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
            <Grid
              item
              size={{ xs: 12, md: 5 }}
              sx={{
                borderLeft: 1,
                borderColor: "grey.800",
                p: 3,
              }}
            >
              <Typography variant="h5" gutterBottom>
                Local Gmail AI Assistant
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Ask for calendar events, anonymize emails data, and more for emails within the day filtered.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ p: 1 }}>
                {messages.map((msg, index) => 
                  msg.type === "message" ? (
                    <MessageBox key={index} source={msg.source} sx={{pb: 3, borderRadius: 4}}>
                      <Typography variant="subtitle2" fontWeight="bold" textAlign="left">
                        {msg.source === "user"
                          ? "You"
                          : "System"}
                      </Typography>
                      <Typography variant="body1" color="text.primary" sx={{py: 1}}>{msg.text}</Typography>
                      <Typography variant="caption" sx={{ float: "right" }} color="text.primary">
                        {msg.timestamp}
                      </Typography>
                    </MessageBox>
                  ) : msg.type === "calendar_event" ? (
                    <MessageBox key={index} source={msg.source} sx={{pb: 3, borderRadius: 4}}>
                      <Typography variant="subtitle2" fontWeight="bold" textAlign="left">
                        {msg.source === "user"
                          ? "You"
                          : "System"}
                      </Typography>
                      <Typography variant="h6" color="text.primary" sx={{py: 1}}>{msg.text}</Typography>
                       {msg.events && msg.events.length > 0 && (
                         <Box sx={{ mt: 1 }}>
                           <Typography variant="subtitle2" fontWeight="bold">
                             Events:
                           </Typography>
                           <Grid container spacing={2} sx={{ mt: 1 }}>
                            {msg.events.map((event, i) => (
                              <Grid item xs={12} sm={6} key={i}>
                                <EventCard event={event} />
                              </Grid>
                            ))}
                          </Grid>
                         </Box>
                       )}
                      <Typography variant="caption" sx={{ float: "right" }} color="text.primary">
                        {msg.timestamp}
                      </Typography>
                    </MessageBox>
                  ) : msg.type === "generate_labels" ? (
                    <MessageBox key={index} source={msg.source} sx={{pb: 3, borderRadius: 4}}>
                      <Typography variant="subtitle2" fontWeight="bold" textAlign="left">
                        {msg.source === "user"
                          ? "You"
                          : "System"}
                      </Typography>
                      <Typography variant="h6" color="text.primary" sx={{py: 1}}>{msg.text}</Typography>
                       {msg.labels && msg.labels.length > 0 && (
                         <Box sx={{ mt: 1 }}>
                           <Typography variant="subtitle2" fontWeight="bold">
                             Labels:
                           </Typography>
                           <Grid container spacing={2} sx={{ mt: 1 }}>
                            {msg.labels.map((labels, i) => (
                              <Grid item size={{ xs: 12, md: 6 }} key={i}>
                                <LabelCard labels={labels} />
                              </Grid>
                            ))}
                          </Grid>
                         </Box>
                       )}
                      <Typography variant="caption" sx={{ float: "right" }} color="text.primary">
                        {msg.timestamp}
                      </Typography>
                    </MessageBox>
                  ) : msg.type === "summarize_email" ? (
                    <MessageBox key={index} source={msg.source} sx={{pb: 3, borderRadius: 4}}>
                      <Typography variant="subtitle2" fontWeight="bold" textAlign="left">
                        {msg.source === "user"
                          ? "You"
                          : "System"}
                      </Typography>
                      <Typography variant="h6" color="text.primary" sx={{py: 1}}>{msg.text}</Typography>
                       {msg.summaries && msg.summaries.length > 0 && (
                         <Box sx={{ mt: 1 }}>
                           <Typography variant="subtitle2" fontWeight="bold">
                             Summaries:
                           </Typography>
                           <Grid container spacing={2} sx={{ mt: 1 }}>
                            {msg.summaries.map((summary, i) => (
                              <Grid item size={{ xs: 12, md: 6 }} key={i}>
                                <SummaryCard summary={summary} />
                              </Grid>
                            ))}
                          </Grid>
                         </Box>
                       )}
                      <Typography variant="caption" sx={{ float: "right" }} color="text.primary">
                        {msg.timestamp}
                      </Typography>
                    </MessageBox>
                  ) : null
                )}
                {isTyping && (
                  <MessageBox source="assistant" sx={{borderRadius: 4}}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      System
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          bgcolor: "accent.primary",
                          borderRadius: "50%",
                          animation: "blink 1s infinite",
                        }}
                      />
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          bgcolor: "accent.primary",
                          borderRadius: "50%",
                          animation: "blink 1s infinite 0.2s",
                        }}
                      />
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          bgcolor: "accent.primary",
                          borderRadius: "50%",
                          animation: "blink 1s infinite 0.4s",
                        }}
                      />
                    </Box>
                  </MessageBox>
                )}
                <div ref={messagesEndRef} />
              </Box>
              <form onSubmit={sendMessage}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type your message here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  inputRef={inputRef}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          type="submit"
                          color="primary"
                          disabled={!input.trim()}
                          aria-label="send"
                        >
                          <SendIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ borderRadius: 1 }}
                />
              </form>
              <Box
                sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor:
                      status === "Ready"
                        ? "success.main"
                        : status === "Processing"
                        ? "warning.main"
                        : "error.main",
                  }}
                />
                <Typography variant="body2" color="grey.400">
                  {status}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
