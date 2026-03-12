import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import OpenAI from 'npm:openai@4.77.3';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { videoId } = await req.json();
        
        // Fetch video from database
        const videos = await base44.entities.Video.filter({ id: videoId });
        const video = videos[0];
        
        if (!video) {
            return Response.json({ error: 'Video not found' }, { status: 404 });
        }

        if (!video.has_transcript || !video.transcript) {
            return Response.json({ error: 'No transcript available for detailed analysis' }, { status: 400 });
        }
        
        // Normalize transcript to timestamped segments
        const normalizeTranscript = (transcriptArray) => {
            if (!transcriptArray || transcriptArray.length === 0) return null;
            
            return transcriptArray.map(segment => {
                const hours = Math.floor(segment.start / 3600);
                const minutes = Math.floor((segment.start % 3600) / 60);
                const seconds = Math.floor(segment.start % 60);
                
                const timestamp = hours > 0 
                    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
                    : `${minutes}:${String(seconds).padStart(2, '0')}`;
                
                return {
                    timestamp,
                    text: segment.text
                };
            });
        };
        
        const transcriptSegments = normalizeTranscript(video.transcript);
        const videoTitle = video.title;
        
        console.log(`[DEBUG] Processing detailed steps analysis with old prompt`);
        
        const transcriptText = transcriptSegments.map(seg => `[${seg.timestamp}] ${seg.text}`).join('\n');
        
        // Truncate transcript if too long
        const maxTranscriptLength = 50000;
        let truncatedTranscriptText = transcriptText;
        if (transcriptText.length > maxTranscriptLength) {
            truncatedTranscriptText = transcriptText.substring(0, maxTranscriptLength) + '\n\n[Transcript truncated for analysis...]';
            console.log(`[DEBUG] Transcript truncated from ${transcriptText.length} to ${maxTranscriptLength} characters`);
        }

        const experienceLevel = video.user_level || "novice";
        const inputText = `Video Title: "${videoTitle}"\n\nExperience Level: ${experienceLevel}\n\nTranscript (timestamped):\n${truncatedTranscriptText}`;

        // Use OLD prompt for detailed execution steps
        const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get("OpenAIAPI")}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: {
                    id: "pmpt_699aac41a16c8197abd37bea2edb25b108ea3df63cb16f50",
                    version: "3"
                },
                input: inputText
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI Responses API error: ${response.status} ${errorText}`);
        }

        const completionData = await response.json();
        
        let analysis;
        if (completionData.output) {
            if (Array.isArray(completionData.output)) {
                const messageItem = completionData.output.find(item => item.type === 'message' && item.status === 'completed');
                if (messageItem && messageItem.content) {
                    const outputText = messageItem.content.find(c => c.type === 'output_text');
                    if (outputText && outputText.text) {
                        analysis = JSON.parse(outputText.text);
                    }
                }
            } else if (typeof completionData.output === 'string') {
                analysis = JSON.parse(completionData.output);
            } else {
                analysis = completionData.output;
            }
        } else if (Array.isArray(completionData)) {
            const messageItem = completionData.find(item => item.type === 'message' && item.status === 'completed');
            if (messageItem && messageItem.content) {
                const outputText = messageItem.content.find(c => c.type === 'output_text');
                if (outputText && outputText.text) {
                    analysis = JSON.parse(outputText.text);
                }
            }
        }
        
        if (!analysis) {
            throw new Error('Could not parse analysis from OpenAI response');
        }

        console.log(`[DEBUG] Detailed steps analysis completed with ${analysis.execution_steps?.length || 0} steps`);
        
        // Sanitize execution_steps
        const sanitizedExecutionSteps = (analysis.execution_steps || []).map(step => ({
            step_name: step.step_name || 'Unnamed Step',
            step_summary: step.step_summary || '',
            process: Array.isArray(step.process) ? step.process : [],
            unspoken_requirements: Array.isArray(step.unspoken_requirements) ? step.unspoken_requirements.map(req => ({
                factor: req.factor || 'resources',
                detail: req.detail || '',
                numeric_range: req.numeric_range || ''
            })) : []
        }));

        const limitedExecutionSteps = sanitizedExecutionSteps.slice(0, 15);

        // Transform steps for legacy support
        const transformedSteps = limitedExecutionSteps.map((step, idx) => {
            const skills = [];
            const money = [];
            const time = [];
            const constraints = [];

            if (step.unspoken_requirements && Array.isArray(step.unspoken_requirements)) {
                step.unspoken_requirements.forEach(req => {
                    const detail = req.numeric_range ? `${req.detail} (${req.numeric_range})` : req.detail;
                    
                    if (req.factor === 'skills') {
                        skills.push(detail);
                    } else if (req.factor === 'money') {
                        money.push(detail);
                    } else if (req.factor === 'time') {
                        time.push(detail);
                    } else {
                        constraints.push(detail);
                    }
                });
            }

            return {
                step_number: idx + 1,
                title: step.step_name,
                skills_required: skills.length > 0 ? skills : undefined,
                money_required: money.length > 0 ? money : undefined,
                time_required: time.length > 0 ? time : undefined,
                constraints: constraints.length > 0 ? constraints : undefined
            };
        });

        // Classify execution steps into phases
        const classifyStepPhase = (stepName) => {
            const lowerName = stepName.toLowerCase();
            
            if (lowerName.match(/register|setup|create account|verify|choose plan|select|initial|start|begin|establish|set up|configure/i)) {
                return 'entry';
            }
            
            if (lowerName.match(/test|validate|pilot|trial|proof|experiment|sample|analyze|research|evaluate|assess|verify market/i)) {
                return 'validation';
            }
            
            if (lowerName.match(/scale|grow|expand|automate|optimize|hire|outsource|multiply|increase capacity|delegate/i)) {
                return 'scale';
            }
            
            return 'execution';
        };
        
        const phasedSteps = {
            entry: [],
            validation: [],
            execution: [],
            scale: []
        };
        
        limitedExecutionSteps.forEach(step => {
            const phase = classifyStepPhase(step.step_name);
            phasedSteps[phase].push(step.step_name);
        });
        
        let executionClaims = {
            entry: {
                status: phasedSteps.entry.length > 0 ? "Mentioned" : "Omitted",
                sub_points: phasedSteps.entry
            },
            validation: {
                status: phasedSteps.validation.length > 0 ? "Mentioned" : "Omitted",
                sub_points: phasedSteps.validation
            },
            execution: {
                status: phasedSteps.execution.length > 0 ? "Mentioned" : "Omitted",
                sub_points: phasedSteps.execution
            },
            scale: {
                status: phasedSteps.scale.length > 0 ? "Mentioned" : "Omitted",
                sub_points: phasedSteps.scale
            }
        };

        console.log('[DEBUG] Classified execution claims by phase:', JSON.stringify(executionClaims));

        // Calculate friction level
        let overallFriction = 'medium';
        if (limitedExecutionSteps && limitedExecutionSteps.length > 0) {
          const highFrictionSteps = limitedExecutionSteps.filter(step => {
            const reqs = step.unspoken_requirements || [];
            const hasHighMoney = reqs.some(r => {
              if (r.factor === 'money' && r.numeric_range) {
                const match = r.numeric_range.match(/\$?([\d,]+)/);
                return match && parseInt(match[1].replace(/,/g, '')) >= 2000;
              }
              return false;
            });
            const hasLongTime = reqs.some(r => {
              if (r.factor === 'time' && r.numeric_range) {
                return /month|year|ongoing/i.test(r.numeric_range);
              }
              return false;
            });
            const hasConstraints = reqs.filter(r => r.factor === 'resources' || r.factor === 'connections').length > 0;
            return hasHighMoney || hasLongTime || hasConstraints;
          });

          const frictionRatio = highFrictionSteps.length / limitedExecutionSteps.length;
          if (frictionRatio >= 0.6) {
            overallFriction = 'high';
          } else if (frictionRatio >= 0.3) {
            overallFriction = 'medium';
          } else {
            overallFriction = 'low';
          }
        }

        console.log('[DEBUG] Calculated overall_friction:', overallFriction);

        // Update ONLY the detailed steps fields
        const updateData = {
            friction_analysis: {
                ...(video.friction_analysis || {}),
                execution_steps: limitedExecutionSteps,
                execution_claims: executionClaims,
                overall_friction: overallFriction
            },
            execution_steps: transformedSteps,
            last_evaluated: new Date().toISOString()
        };

        await base44.entities.Video.update(videoId, updateData);

        return Response.json({
            success: true,
            analysis: analysis
        });

    } catch (error) {
        console.error('Error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});