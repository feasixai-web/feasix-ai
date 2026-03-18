import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

        // Check if raw analysis output exists
        if (!video.raw_friction_analysis_output) {
            return Response.json({ 
                error: 'No raw analysis output available. Please run a full analysis first.' 
            }, { status: 400 });
        }

        console.log('[DEBUG] Processing stored raw analysis output for video:', videoId);
        
        const analysis = video.raw_friction_analysis_output;
        const videoTitle = video.title;
        
        // Parse talking points from raw output
        let parsedTalkingPoints = [];
        const talkingPointsRaw = analysis.talking_points || analysis.talking_point_extraction || analysis.TALKING_POINTS;
        if (talkingPointsRaw && Array.isArray(talkingPointsRaw)) {
            parsedTalkingPoints = talkingPointsRaw.map(point => {
                if (typeof point === 'object' && point !== null) {
                    const ts = point.timestamp ? point.timestamp.replace(/[\[\]]/g, '') : null;
                    return ts && point.label ? { timestamp: ts, label: point.label } : null;
                }
                const match = point.match(/^\[([^\]]+)\]\s*(.+)$/);
                return match ? { timestamp: match[1], label: match[2] } : null;
            }).filter(Boolean);
            console.log(`[DEBUG] Parsed ${parsedTalkingPoints.length} talking points`);
        } else {
            console.log(`[DEBUG] No talking points found in raw analysis`);
        }
        
        // Calculate signal_density if not provided
        if (!analysis.signal_density && analysis.execution_steps) {
            const stepCount = analysis.execution_steps.length;
            const avgRequirements = analysis.execution_steps.reduce((sum, step) => {
                return sum + (step.unspoken_requirements?.length || 0);
            }, 0) / stepCount;
            
            const baseDensity = Math.min(stepCount * 5, 50);
            const requirementBonus = Math.min(avgRequirements * 10, 50);
            analysis.signal_density = Math.round(baseDensity + requirementBonus);
            
            console.log(`[DEBUG] Calculated signal_density: ${analysis.signal_density}`);
        }

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

        // Transform execution steps for legacy support
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

        // Parse nuances from raw AI output
        let parsedNuances = [];
        if (analysis.NUANCES && Array.isArray(analysis.NUANCES)) {
            parsedNuances = analysis.NUANCES.map(nuanceObj => ({
                timestamp: nuanceObj.Timestamp || nuanceObj.timestamp || '',
                nuance: nuanceObj.Nuance || nuanceObj.nuance || '',
                verbatim_evidence_quote: nuanceObj.Claim || nuanceObj.claim || ''
            })).filter(n => n.nuance);
            console.log(`[DEBUG] Parsed ${parsedNuances.length} nuances from NUANCES array`);
        }

        // Sanitize OVERVIEW
        const sanitizedOverview = {
            CARD_1: analysis.OVERVIEW?.CARD_1,
            CARD_2: analysis.OVERVIEW?.CARD_2,
            CARD_3: {
                Title: analysis.OVERVIEW?.CARD_3?.Title,
                Content: Array.isArray(analysis.OVERVIEW?.CARD_3?.Content) 
                    ? analysis.OVERVIEW.CARD_3.Content.join('\n') 
                    : analysis.OVERVIEW?.CARD_3?.Content
            },
            CARD_4: {
                Title: analysis.OVERVIEW?.CARD_4?.Title,
                Content: Array.isArray(analysis.OVERVIEW?.CARD_4?.Content) 
                    ? analysis.OVERVIEW.CARD_4.Content.join('\n') 
                    : analysis.OVERVIEW?.CARD_4?.Content
            }
        };

        // Update video with parsed data
        const updateData = {
            friction_analysis: {
                FEASIX_VERDICT: analysis.FEASIX_VERDICT || '',
                OVERVIEW: sanitizedOverview,
                execution_steps: limitedExecutionSteps,
                execution_nuggets: analysis.execution_nuggets || [],
                final_verdict: analysis.final_verdict || { rating: 'SKIM', reason: 'Analysis incomplete' },
                evidence: analysis.evidence || [],
                title: analysis.title || videoTitle,
                signal_density_rationale: analysis.signal_density_rationale || '',
                execution_claims: executionClaims,
                overall_friction: overallFriction,
                nuances: parsedNuances.length > 0 ? parsedNuances : (analysis.nuances || [])
            },
            execution_steps: transformedSteps,
            rating: analysis.final_verdict?.rating?.toLowerCase() || 'skim',
            rating_rationale: analysis.signal_density_rationale || analysis.final_verdict?.reason || '',
            signal_density: analysis.signal_density || 0,
            failure_points_discussed: analysis.failure_points_discussed || [],
            constraints_mentioned: analysis.constraints_mentioned || [],
            talking_points: parsedTalkingPoints,
            last_evaluated: new Date().toISOString()
        };

        await base44.entities.Video.update(videoId, updateData);
        
        console.log(`[DEBUG] Successfully processed and updated video ${videoId} from stored raw output`);

        return Response.json({
            success: true,
            message: 'Video data refreshed from stored analysis'
        });

    } catch (error) {
        console.error('Error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});